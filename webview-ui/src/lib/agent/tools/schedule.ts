import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const schedule = tool(
  async (args) => {
    try {
      const response = await vscode.request<string>('tool:schedule', args);
      return response;
    } catch (error: any) {
      return `Error scheduling task: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'schedule',
    description: 'Schedule a one-shot timer or a recurring cron job.',
    schema: z.object({
      Prompt: z.string().describe('The message content to include in the notification.'),
      DurationSeconds: z.number().optional().describe('The number of seconds to wait.'),
      CronExpression: z.string().optional().describe('A standard cron expression.'),
      MaxIterations: z.number().optional().describe('Maximum number of times the cron schedule will fire.'),
    }),
  }
);
