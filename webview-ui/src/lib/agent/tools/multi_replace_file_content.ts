import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const multiReplaceFileContent = tool(
  async (args) => {
    try {
      const response = await vscode.request<string>('tool:multi_replace_file_content', args);
      return response || 'File updated successfully.';
    } catch (error: any) {
      return `Error replacing file content: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'multi_replace_file_content',
    description: 'Edit an existing file by making multiple, non-contiguous edits.',
    schema: z.object({
      TargetFile: z.string().describe('The target file to modify. Must be an absolute path.'),
      Instruction: z.string().describe('A description of the changes that you are making.'),
      Description: z.string().describe('Brief explanation of what this change did.'),
      ReplacementChunks: z.array(z.object({
        AllowMultiple: z.boolean(),
        TargetContent: z.string(),
        ReplacementContent: z.string(),
        StartLine: z.number(),
        EndLine: z.number()
      })).describe('A list of chunks to replace.'),
    }),
  }
);
