import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const findByName = tool(
  async (args) => {
    try {
      const response = await vscode.request<string[]>('tool:find_by_name', args);
      return JSON.stringify(response, null, 2);
    } catch (error: any) {
      return `Error finding by name: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'find_by_name',
    description: 'Search for files and directories using glob patterns.',
    schema: z.object({
      SearchDirectory: z.string().describe('Directory to search in.'),
      Pattern: z.string().describe('Glob pattern to search for.'),
      Type: z.string().optional().describe('Type of search: "file" or "directory" (optional).'),
      Excludes: z.array(z.string()).optional().describe('Glob patterns to exclude (optional).'),
      Extensions: z.array(z.string()).optional().describe('Extensions to filter by (optional).'),
      MaxDepth: z.number().optional().describe('Maximum depth for search (optional).'),
    }),
  }
);
