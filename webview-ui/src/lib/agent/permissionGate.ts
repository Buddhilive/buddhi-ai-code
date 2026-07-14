// Phase 1 modes only
export type PermissionMode = 'default' | 'acceptEdits';

// Deny-first blocklist (always blocked regardless of mode)
const ALWAYS_BLOCKED = ['rm -rf /', 'format c:', 'del /f /s /q', 'rmdir /s /q'];

// Per-tool risk classification
export const toolRiskMap: Record<string, 'safe' | 'file-write' | 'shell'> = {
  view_file: 'safe',
  list_dir: 'safe',
  grep_search: 'safe',
  find_by_name: 'safe',
  read_url_content: 'safe',
  write_to_file: 'file-write',
  replace_file_content: 'file-write',
  multi_replace_file_content: 'file-write',
  run_command: 'shell',
  schedule: 'shell',
};

export async function evaluateToolCall(
  toolName: string, 
  args: Record<string, any>, 
  mode: PermissionMode
): Promise<'auto-approve' | 'request-user' | 'block'> {
  
  if (toolName === 'run_command' && args.CommandLine) {
    const cmd = args.CommandLine.toLowerCase();
    if (ALWAYS_BLOCKED.some(pattern => cmd.includes(pattern))) {
      return 'block';
    }
  }

  const risk = toolRiskMap[toolName] || 'shell'; // Unknown tools default to highest risk

  if (risk === 'safe') {
    return 'auto-approve';
  }

  if (mode === 'acceptEdits' && risk === 'file-write') {
    return 'auto-approve';
  }

  return 'request-user';
}
