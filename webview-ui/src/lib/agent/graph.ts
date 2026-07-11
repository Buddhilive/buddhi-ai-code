import { StateGraph, START, END } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { llm } from './llm';

// Define the state for the graph
interface AgentState {
  messages: BaseMessage[];
}

// Define the node that calls the model
async function chatbot(state: AgentState) {
  const response = await llm.invoke(state.messages);
  // Return the new state
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
