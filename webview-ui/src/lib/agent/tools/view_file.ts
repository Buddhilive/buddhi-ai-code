import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const viewFile = tool(
  async (args) => {
    try {
      const response = await vscode.request<string>('tool:view_file', args);
      return response;
    } catch (error: any) {
      return `Error viewing file: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'view_file',
    description: 'View the contents of a file from the local filesystem. Returns the file contents with line numbers.',
    schema: z.object({
      AbsolutePath: z.string().describe('Path to file to view. Must be an absolute path.'),
      StartLine: z.number().optional().describe('Optional. Startline to view, 1-indexed as usual, inclusive.'),
      EndLine: z.number().optional().describe('Optional. Endline to view, 1-indexed as usual, inclusive.'),
    }),
  }
);
