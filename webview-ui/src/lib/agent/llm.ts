import { ChatOpenAI } from '@langchain/openai';
import { AGENT_CONFIG } from './config';

export const llm = new ChatOpenAI({
  modelName: AGENT_CONFIG.modelName,
  temperature: AGENT_CONFIG.temperature,
  maxTokens: AGENT_CONFIG.maxTokens,
  apiKey: 'dummy-key-for-local-server', // Required by LangChain even for local servers
  streaming: true, // CRITICAL: Force streaming so on_chat_model_stream events fire
  configuration: {
    baseURL: AGENT_CONFIG.baseUrl,
    defaultHeaders: {
      'Connection': 'close',
    },
  },
});
