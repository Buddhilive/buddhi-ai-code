import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const readUrlContent = tool(
  async (args) => {
    try {
      const response = await vscode.request<string>('tool:read_url_content', args);
      return response;
    } catch (error: any) {
      return `Error reading URL: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'read_url_content',
    description: 'Fetch content from a URL via HTTP request.',
    schema: z.object({
      Url: z.string().describe('URL to read content from.'),
    }),
  }
);
