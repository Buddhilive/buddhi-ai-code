import { StateGraph, START, END, MemorySaver } from '@langchain/langgraph';
import { BaseMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { llm } from './llm';
import { allTools } from './tools';

// Define the state for the graph
interface AgentState {
  messages: BaseMessage[];
}

// Bind tools to the LLM
const llmWithTools = llm.bindTools(allTools);

// Define the node that calls the model.
async function chatbot(state: AgentState, config?: RunnableConfig) {
  let messages = state.messages;

  // Prepend a system message if one doesn't exist
  if (messages.length > 0 && messages[0].getType() !== 'system') {
    const sysMsg = new SystemMessage(
      `You are Buddhi AI, a powerful agentic AI coding assistant designed to help the user with their coding tasks.
You have access to a suite of tools for file operations, search, terminal commands, and more.
Always prioritize using the most specific tool you can for the task at hand.
When using write_to_file, replace_file_content, multi_replace_file_content, and run_command, the user will be prompted for confirmation.`
    );
    messages = [sysMsg, ...messages];
  }

  const response = await llmWithTools.invoke(messages, config);
  return { messages: [response] };
}

// Create the tools node
const toolNode = new ToolNode(allTools);

// Routing function to decide whether to use tools or end
function routeToTools(state: AgentState) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;
  
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return 'tools';
  }
  return END;
}

// Define the graph
const graphBuilder = new StateGraph<AgentState>({
  channels: {
    messages: {
      value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
      default: () => [],
    },
  },
})
  .addNode('chatbot', chatbot)
  .addNode('tools', toolNode)
  .addEdge(START, 'chatbot')
  .addConditionalEdges('chatbot', routeToTools)
  .addEdge('tools', 'chatbot');

// Initialize memory for keeping conversation state between tool calls
const memory = new MemorySaver();

// Compile the graph
export const app = graphBuilder.compile({ checkpointer: memory });
