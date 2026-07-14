import { vscode } from '../vscode';

export async function loadWorkspaceGuidelines(workspacePaths: string[]): Promise<string> {
  if (workspacePaths.length === 0) {
    return '';
  }
  
  try {
    const result = await vscode.request<string>('tool:load_workspace', {
      WorkspacePaths: workspacePaths
    });
    return result || '';
  } catch (error) {
    console.error('Error loading workspace guidelines:', error);
    return '';
  }
}
