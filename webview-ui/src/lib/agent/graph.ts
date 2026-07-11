import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { llm } from './llm';

// Define the state for the graph
interface AgentState {
  messages: BaseMessage[];
}

// Define the node that calls the model.
// Pass config to llm.invoke so callbacks propagate correctly in browser environments.
async function chatbot(state: AgentState, config?: RunnableConfig) {
  const response = await llm.invoke(state.messages, config);
  return { messages: [response] };
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
  .addEdge(START, 'chatbot')
  .addEdge('chatbot', END);

// Compile the graph
export const app = graphBuilder.compile();
