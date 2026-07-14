import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const replaceFileContent = tool(
  async (args) => {
    try {
      const response = await vscode.request<string>('tool:replace_file_content', args);
      return response || 'File updated successfully.';
    } catch (error: any) {
      return `Error replacing file content: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'replace_file_content',
    description: 'Edit an existing file by replacing a single contiguous block of text.',
    schema: z.object({
      TargetFile: z.string().describe('The target file to modify. Must be an absolute path.'),
      Instruction: z.string().describe('A description of the changes that you are making.'),
      Description: z.string().describe('Brief explanation of what this change did.'),
      AllowMultiple: z.boolean().describe('If true, multiple occurrences will be replaced.'),
      TargetContent: z.string().describe('The exact string to be replaced.'),
      ReplacementContent: z.string().describe('The content to replace the target content with.'),
      StartLine: z.number().describe('The starting line number of the chunk (1-indexed).'),
      EndLine: z.number().describe('The ending line number of the chunk (1-indexed).'),
    }),
  }
);
