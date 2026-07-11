import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';
import { requestConfirmation } from '../../confirmation/ConfirmationContext';

export const writeToFile = tool(
  async (args) => {
    try {
      const confirmed = await requestConfirmation(
        `Write to File`,
        `Create or overwrite ${args.TargetFile}?`
      );
      if (!confirmed) {
        return `Action denied by user.`;
      }
      const response = await vscode.request<string>('tool:write_to_file', args);
      return response || 'File written successfully.';
    } catch (error: any) {
      return `Error writing to file: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'write_to_file',
    description: 'Create new files or overwrite existing ones.',
    schema: z.object({
      TargetFile: z.string().describe('The target file to create and write code to. Must be an absolute path.'),
      Overwrite: z.boolean().describe('Set this to true to overwrite an existing file.'),
      CodeContent: z.string().describe('The code contents to write to the file.'),
      Description: z.string().describe('Brief explanation of what this change did.'),
    }),
  }
);
