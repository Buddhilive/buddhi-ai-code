import { BaseMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { encodingForModel } from 'js-tiktoken';
import { AGENT_CONFIG } from './config';
import { llm } from './llm';

// Rough token estimation
export function estimateTokens(text: string): number {
  try {
    const enc = encodingForModel('gpt-4o'); // General proxy for modern tiktoken models
    const tokens = enc.encode(text);
    return tokens.length;
  } catch {
    // fallback if model not found
    return Math.ceil(text.length / 4);
  }
}

export function countMessagesTokens(messages: BaseMessage[]): number {
  return messages.reduce((acc, msg) => {
    let content = '';
    if (typeof msg.content === 'string') content = msg.content;
    else content = JSON.stringify(msg.content);
    return acc + estimateTokens(content);
  }, 0);
}

export async function compactContext(messages: BaseMessage[]): Promise<BaseMessage[]> {
  const currentTokens = countMessagesTokens(messages);
  const threshold = AGENT_CONFIG.maxContextTokens - AGENT_CONFIG.compactionThreshold;

  if (currentTokens < threshold || messages.length < 10) {
    return messages; // No compaction needed
  }

  console.log(`Token count ${currentTokens} exceeds threshold ${threshold}. Triggering compaction...`);

  // Preserve the initial system message if present
  let preservedSystem: BaseMessage | null = null;
  let historyToCompact = messages;
  
  if (messages.length > 0 && messages[0].getType() === 'system') {
    preservedSystem = messages[0];
    historyToCompact = messages.slice(1);
  }

  // Keep the most recent 6 messages intact
  const recentMessages = historyToCompact.slice(-6);
  let messagesToSummarize = historyToCompact.slice(0, -6);

  // Stage 1: Budget Reduction
  messagesToSummarize = messagesToSummarize.map(msg => {
    if (msg.getType() === 'tool') {
      const toolMsg = msg as ToolMessage;
      let content = typeof toolMsg.content === 'string' ? toolMsg.content : JSON.stringify(toolMsg.content);
      if (content.length > AGENT_CONFIG.maxToolOutputChars) {
        content = content.substring(0, AGENT_CONFIG.maxToolOutputChars) + '\n...[TRUNCATED BY BUDGET REDUCTION]';
        return new ToolMessage({ content, name: toolMsg.name, tool_call_id: toolMsg.tool_call_id });
      }
    }
    return msg;
  });

  // Stage 5: Auto-Compact Summary
  const summaryPrompt = `Analyze the following history of development steps and tool executions. Create a highly condensed summary that preserves the primary task, files analyzed, steps taken, and errors fixed.\n\nHistory to summarize:\n${JSON.stringify(messagesToSummarize.map(m => m.toJSON()))}`;

  try {
    const summaryResponse = await llm.invoke([{ role: 'user', content: summaryPrompt }]);
    const summaryMsg = new SystemMessage(`Summary of previous tasks and findings:\n${summaryResponse.content}`);
    
    const newMessages: BaseMessage[] = [];
    if (preservedSystem) {
      newMessages.push(preservedSystem);
    }
    newMessages.push(summaryMsg);
    newMessages.push(...recentMessages);
    return newMessages;
  } catch (error) {
    console.error('Error during context compaction:', error);
    // Return budget-reduced messages if summary LLM call fails
    const fallbackMessages = [];
    if (preservedSystem) fallbackMessages.push(preservedSystem);
    fallbackMessages.push(...messagesToSummarize);
    fallbackMessages.push(...recentMessages);
    return fallbackMessages;
  }
}
