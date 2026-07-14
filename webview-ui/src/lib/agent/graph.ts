import { StateGraph, START, END, MemorySaver, Annotation } from '@langchain/langgraph';
import { BaseMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { llm } from './llm';
import { allTools } from './tools';
import { loadWorkspaceGuidelines } from './workspaceLoader';
import { compactContext } from './compaction';
import { evaluateToolCall, toolRiskMap } from './permissionGate';
import { AGENT_CONFIG } from './config';
import { requestConfirmation } from '../confirmation/ConfirmationContext';

// Define the state for the graph
export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => {
      // Allow overriding the messages array if passed as an object with __override
      if (y && (y as any).__override) {
        return (y as any).messages;
      }
      return x.concat(y);
    },
    default: () => [],
  }),
  scratchpad: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
  workspaceGuidelines: Annotation<string>({
    reducer: (x, y) => y,
    default: () => '',
  }),
  pendingToolCall: Annotation<any>({
    reducer: (x, y) => y,
    default: () => null,
  }),
});

// Bind tools to the LLM
const llmWithTools = llm.bindTools(allTools);

async function initializeWorkspace(state: typeof GraphState.State) {
  if (state.workspaceGuidelines) return {}; // Already initialized
  
  const workspacePaths = (typeof window !== 'undefined' && (window as any).VSCODE_WORKSPACE_PATHS) || [];
  const guidelines = await loadWorkspaceGuidelines(workspacePaths);
  return { workspaceGuidelines: guidelines };
}

// Define the node that calls the model.
async function chatbot(state: typeof GraphState.State, config?: RunnableConfig) {
  let messages = [...state.messages];
  let doOverride = false;

  // Prepend a system message if one doesn't exist
  if (messages.length > 0 && messages[0].getType() !== 'system') {
    const workspacePaths = (typeof window !== 'undefined' && (window as any).VSCODE_WORKSPACE_PATHS) || [];
    const workspaceContext = workspacePaths.length > 0 
      ? `The active workspace is located at: ${workspacePaths.join(', ')}.`
      : `No active workspace is open.`;

    let sysContent = `You are Buddhi AI, a powerful agentic AI coding assistant designed to help the user with their coding tasks.
You have access to a suite of tools for file operations, search, terminal commands, and more.
${workspaceContext}
Always use absolute paths when calling tools like view_file, write_to_file, etc.
Always prioritize using the most specific tool you can for the task at hand.
When using write_to_file, replace_file_content, multi_replace_file_content, and run_command, the user will be prompted for confirmation.`;

    if (state.workspaceGuidelines) {
      sysContent += `\n\n# Workspace Guidelines\n${state.workspaceGuidelines}`;
    }
    if (state.scratchpad) {
      sysContent += `\n\n# Scratchpad (Recent Execution Output)\n${state.scratchpad}`;
    }

    const sysMsg = new SystemMessage(sysContent);
    messages = [sysMsg, ...messages];
    doOverride = true;
  } else if (messages.length > 0) {
    // If system message exists, we update its content to inject latest scratchpad
    let sysContent = (messages[0].content as string).split('\n\n# Scratchpad')[0];
    if (state.scratchpad) {
      sysContent += `\n\n# Scratchpad (Recent Execution Output)\n${state.scratchpad}`;
    }
    messages[0] = new SystemMessage(sysContent);
    doOverride = true;
  }

  const response = await llmWithTools.invoke(messages, config);
  
  if (doOverride) {
    return { messages: { __override: true, messages: [...messages, response] }, scratchpad: '' };
  }
  return { messages: [response], scratchpad: '' };
}

// Node to compact context
async function doCompactContext(state: typeof GraphState.State) {
  const newMessages = await compactContext(state.messages);
  return { messages: { __override: true, messages: newMessages } };
}

// Create the tools node
const toolNode = new ToolNode(allTools);

// Routing function to decide whether to use tools or end
function routeToSafetyGate(state: typeof GraphState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'safety_gate';
  }
  return 'compact_context';
}

async function safetyGate(state: typeof GraphState.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  
  if (!lastMessage.tool_calls || lastMessage.tool_calls.length === 0) {
    return {};
  }
  
  const toolCall = lastMessage.tool_calls[0];
  const decision = await evaluateToolCall(toolCall.name, toolCall.args, AGENT_CONFIG.permissionMode);
  
  if (decision === 'block') {
    return {
      scratchpad: `Error: Command blocked by safety policy.`,
      messages: { 
        __override: true, 
        messages: [
          ...messages,
          { role: 'tool', name: toolCall.name, tool_call_id: toolCall.id, content: JSON.stringify({ error: "Command blocked by security policy." }) }
        ]
      }
    };
  }

  if (decision === 'request-user') {
    const confirmed = await requestConfirmation(
      `Permission Request: ${toolCall.name}`,
      '', // No description needed, banner will use toolName and args
      toolCall.name,
      toolCall.args,
      toolRiskMap[toolCall.name] || 'shell'
    );
    if (!confirmed) {
      return {
        scratchpad: `Error: Execution rejected by user.`,
        messages: { 
          __override: true, 
          messages: [
            ...messages,
            { role: 'tool', name: toolCall.name, tool_call_id: toolCall.id, content: JSON.stringify({ error: "Execution rejected by user." }) }
          ]
        }
      };
    }
  }
  
  return { pendingToolCall: toolCall };
}

function routeAfterSafetyGate(state: typeof GraphState.State) {
  if (state.pendingToolCall) {
    return 'tools';
  }
  return 'chatbot';
}

function routeAfterCompaction(state: typeof GraphState.State) {
  return END;
}

// Define the graph
const graphBuilder = new StateGraph(GraphState)
  .addNode('initialize_workspace', initializeWorkspace)
  .addNode('chatbot', chatbot)
  .addNode('safety_gate', safetyGate)
  .addNode('tools', toolNode)
  .addNode('compact_context', doCompactContext)
  .addEdge(START, 'initialize_workspace')
  .addEdge('initialize_workspace', 'chatbot')
  .addConditionalEdges('chatbot', routeToSafetyGate, {
    safety_gate: 'safety_gate',
    compact_context: 'compact_context',
  })
  .addConditionalEdges('safety_gate', routeAfterSafetyGate, {
    tools: 'tools',
    chatbot: 'chatbot' // if rejected, go back to chatbot
  })
  .addEdge('tools', 'chatbot')
  .addEdge('compact_context', END);

// Initialize memory for keeping conversation state between tool calls
const memory = new MemorySaver();

// Compile the graph
export const app = graphBuilder.compile({ checkpointer: memory });
