import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const manageTask = tool(
  async (args) => {
    try {
      const response = await vscode.request<any>('tool:manage_task', args);
      return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
    } catch (error: any) {
      return `Error managing task: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'manage_task',
    description: 'Manage background tasks.',
    schema: z.object({
      Action: z.enum(['list', 'kill', 'status', 'send_input']).describe('The action to perform.'),
      TaskId: z.string().optional().describe('The task ID to manage.'),
      Input: z.string().optional().describe('The input to send to the task.'),
    }),
  }
);
