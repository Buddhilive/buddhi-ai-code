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

/**
 * Runs the agent with the given conversation history and streams the response back token-by-token.
 */
export async function* runAgent(messages: AgentMessage[]): AsyncGenerator<string> {
  console.log('runAgent started with messages:', messages);
  const langchainMessages = convertToLangchainMessages(messages);

  try {
    const stream = await app.streamEvents(
      { messages: langchainMessages },
      { version: 'v2' }
    );

    console.log('Stream obtained, consuming events...');
    for await (const event of stream) {
      console.log('Stream event:', event.event, event.name);
      if (
        event.event === 'on_chat_model_stream' &&
        event.data.chunk?.content
      ) {
        const content = event.data.chunk.content as string;
        console.log('Yielding chunk:', content);
        yield content;
      }
    }
    console.log('Stream finished consuming.');
  } catch (err) {
    console.error('Error in runAgent generator:', err);
    throw err;
  }
}
