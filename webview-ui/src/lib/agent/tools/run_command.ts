import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';
import { requestConfirmation } from '../../confirmation/ConfirmationContext';

export const runCommand = tool(
  async (args) => {
    try {
      const confirmed = await requestConfirmation(
        `Run Command`,
        `Execute '${args.CommandLine}' in terminal?`
      );
      if (!confirmed) {
        return `Action denied by user.`;
      }
      const response = await vscode.request<string>('tool:run_command', args);
      return response || 'Command sent to terminal.';
    } catch (error: any) {
      return `Error running command: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'run_command',
    description: 'Run a bash command in the integrated terminal.',
    schema: z.object({
      CommandLine: z.string().describe('The exact command line string to execute.'),
      Cwd: z.string().describe('The current working directory for the command.'),
      WaitMsBeforeAsync: z.number().optional().describe('Wait time in ms before sending to background.'),
    }),
  }
);
