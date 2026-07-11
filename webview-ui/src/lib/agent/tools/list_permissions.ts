import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { vscode } from '../../vscode';

export const listPermissions = tool(
  async (args) => {
    try {
      const response = await vscode.request<string[]>('tool:list_permissions', args);
      return JSON.stringify(response, null, 2);
    } catch (error: any) {
      return `Error listing permissions: ${error?.message || String(error)}`;
    }
  },
  {
    name: 'list_permissions',
    description: 'Use this tool to list all current permission grants.',
    schema: z.object({}),
  }
);
