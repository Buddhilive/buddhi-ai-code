import { vscode } from '../vscode';
import { BaseMessage } from '@langchain/core/messages';

export async function logSession(messages: BaseMessage[], tokenCount: number) {
  try {
    await vscode.request('tool:log_session', {
      messages: messages.map(m => m.toJSON()),
      tokenCount
    });
  } catch (error) {
    console.error('Failed to log session:', error);
  }
}
