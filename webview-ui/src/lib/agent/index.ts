import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { app } from './graph';

export type AgentMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function convertToLangchainMessages(messages: AgentMessage[]): BaseMessage[] {
  return messages.map((msg) =>
    msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
  );
}

export type StreamEvent = 
  | { type: 'chunk'; text: string }
  | { type: 'tool_call'; name: string; args: any; id: string }
  | { type: 'tool_result'; id: string; result: string; status: 'success' | 'error' }
  | { type: 'state_update'; messages: BaseMessage[]; tokenCount: number };

export async function* runAgent(input: string): AsyncGenerator<StreamEvent> {
  const newMessage = new HumanMessage(input);

  try {
    const stream = await app.streamEvents(
      { messages: [newMessage] },
      { version: 'v2', configurable: { thread_id: 'chat_session_1' } }
    );

    for await (const event of stream) {
      if (event.event === 'on_chat_model_stream' && event.data.chunk?.content) {
        yield { type: 'chunk', text: event.data.chunk.content as string };
      } else if (event.event === 'on_tool_start') {
        yield { 
          type: 'tool_call', 
          name: event.name, 
          args: event.data.input, 
          id: event.run_id 
        };
      } else if (event.event === 'on_tool_end') {
        const isError = event.data.output && typeof event.data.output === 'string' && event.data.output.startsWith('Error');
        yield { 
          type: 'tool_result', 
          id: event.run_id, 
          result: String(event.data.output), 
          status: isError ? 'error' : 'success' 
        };
      }
    }
    
    // After stream, get the final state to update the UI
    const finalState = await app.getState({ configurable: { thread_id: 'chat_session_1' } });
    if (finalState && finalState.values && finalState.values.messages) {
      const msgs = finalState.values.messages as BaseMessage[];
      let tokenCount = 0; // we can calculate this in the hook or here
      yield { type: 'state_update', messages: msgs, tokenCount };
    }
    
  } catch (err) {
    console.error('Error in runAgent generator:', err);
    throw err;
  }
}
