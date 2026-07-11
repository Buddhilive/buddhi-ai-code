import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const grepSearch = tool(
  async (args) => {
    try {
      const response = await vscode.request<any[]>('tool:grep_search', args);
      return JSON.stringify(response, null, 2);
    } catch (error: any) {
      return `Error searching: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'grep_search',
    description: 'Fast text searches within specific paths.',
    schema: z.object({
      SearchPath: z.string().describe('The path to search. Must be an absolute path to a directory or a file.'),
      Query: z.string().describe('The search term or pattern to look for within files.'),
      IsRegex: z.boolean().optional().describe('If true, treats Query as a regular expression pattern.'),
      CaseInsensitive: z.boolean().optional().describe('If true, performs a case-insensitive search.'),
      Includes: z.array(z.string()).optional().describe('Glob patterns to filter files found within the SearchPath.'),
      MatchPerLine: z.boolean().optional().describe('If true, returns each line that matches the query.'),
    }),
  }
);
