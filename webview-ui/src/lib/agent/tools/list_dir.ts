import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const listDir = tool(
  async (args) => {
    try {
      const response = await vscode.request<any[]>('tool:list_dir', args);
      return JSON.stringify(response, null, 2);
    } catch (error: any) {
      return `Error listing directory: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'list_dir',
    description: 'List the contents of a directory.',
    schema: z.object({
      DirectoryPath: z.string().describe('Path to list contents of, should be absolute path to a directory.'),
    }),
  }
);
