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
  const langchainMessages = convertToLangchainMessages(messages);

  const stream = await app.streamEvents(
    { messages: langchainMessages },
    { version: 'v2' }
  );

  for await (const event of stream) {
    if (
      event.event === 'on_chat_model_stream' &&
      event.data.chunk?.content
    ) {
      // Yield the chunk of text
      yield event.data.chunk.content as string;
    }
  }
}
