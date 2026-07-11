import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { requestConfirmation } from '../../confirmation/ConfirmationContext';

export const askPermission = tool(
  async (args) => {
    try {
      const confirmed = await requestConfirmation(
        `Permission Request`,
        `Allow action: ${args.Action} on target: ${args.Target}?\nReason: ${args.Reason}`
      );
      if (!confirmed) {
        return `Permission denied.`;
      }
      return 'Permission granted.';
    } catch (error: any) {
      return `Error asking permission: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'ask_permission',
    description: 'Request for permission after a failure due to insufficient permissions.',
    schema: z.object({
      Action: z.enum(['command', 'custom', 'execute_url', 'mcp', 'read_file', 'read_url', 'unsandboxed', 'write_file']).describe('The action to perform.'),
      Target: z.string().describe('The target of the action.'),
      Reason: z.string().describe('The reason why permission is needed.'),
    }),
  }
);
