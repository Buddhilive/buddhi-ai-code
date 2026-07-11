import * as vscode from 'vscode';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import { taskRegistry } from './taskRegistry';
import { PersistentTerminal } from './persistentTerminal';

export const handleViewFile = async (args: any, context: vscode.ExtensionContext) => {
  const uri = vscode.Uri.file(args.AbsolutePath);
  const data = await vscode.workspace.fs.readFile(uri);
  const content = Buffer.from(data).toString('utf8');
  
  let lines = content.split('\n');
  const start = args.StartLine ? Math.max(1, args.StartLine) - 1 : 0;
  const end = args.EndLine ? Math.min(lines.length, args.EndLine) : lines.length;
  
  lines = lines.slice(start, end).map((line, idx) => `${start + idx + 1}: ${line}`);
  return lines.join('\n');
};

export const handleWriteToFile = async (args: any, context: vscode.ExtensionContext) => {
  const uri = vscode.Uri.file(args.TargetFile);
  if (!args.Overwrite) {
    try {
      await vscode.workspace.fs.stat(uri);
      throw new Error(`File ${args.TargetFile} already exists and Overwrite is false.`);
    } catch (e: any) {
      if (e.code !== 'FileNotFound') {
        throw e;
      }
    }
  }
  const data = Buffer.from(args.CodeContent, 'utf8');
  await vscode.workspace.fs.writeFile(uri, data);
  return 'File written successfully.';
};

export const handleReplaceFileContent = async (args: any, context: vscode.ExtensionContext) => {
  const uri = vscode.Uri.file(args.TargetFile);
  const data = await vscode.workspace.fs.readFile(uri);
  const content = Buffer.from(data).toString('utf8');
  const lines = content.split('\n');

  const startLine = args.StartLine - 1;
  const endLine = args.EndLine;
  
  const before = lines.slice(0, startLine).join('\n');
  const targetRegion = lines.slice(startLine, endLine).join('\n');
  const after = lines.slice(endLine).join('\n');

  let newTargetRegion = targetRegion;
  if (args.AllowMultiple) {
    newTargetRegion = targetRegion.split(args.TargetContent).join(args.ReplacementContent);
  } else {
    const idx = targetRegion.indexOf(args.TargetContent);
    if (idx === -1) {
      throw new Error('TargetContent not found in specified range.');
    }
    const lastIdx = targetRegion.lastIndexOf(args.TargetContent);
    if (idx !== lastIdx) {
      throw new Error('Multiple occurrences found, but AllowMultiple is false.');
    }
    newTargetRegion = targetRegion.replace(args.TargetContent, args.ReplacementContent);
  }

  const newContent = [before, newTargetRegion, after].filter(s => s !== '').join(before ? '\n' : '');
  await vscode.workspace.fs.writeFile(uri, Buffer.from(newContent, 'utf8'));
  return 'File replaced successfully.';
};

export const handleMultiReplaceFileContent = async (args: any, context: vscode.ExtensionContext) => {
  const uri = vscode.Uri.file(args.TargetFile);
  const data = await vscode.workspace.fs.readFile(uri);
  let content = Buffer.from(data).toString('utf8');
  
  // Apply chunks (assuming chunks are sorted by start line in descending order to avoid line shifting issues,
  // or we can just apply string replacements if they don't affect other chunks' positions significantly).
  // A safer way is to apply them using VS Code's WorkspaceEdit if we wanted to map lines, but direct string replacement works if target content is unique in the block.
  for (const chunk of args.ReplacementChunks) {
    const lines = content.split('\n');
    const startLine = chunk.StartLine - 1;
    const endLine = chunk.EndLine;
    const targetRegion = lines.slice(startLine, endLine).join('\n');
    
    let newTargetRegion = targetRegion;
    if (chunk.AllowMultiple) {
      newTargetRegion = targetRegion.split(chunk.TargetContent).join(chunk.ReplacementContent);
    } else {
      const idx = targetRegion.indexOf(chunk.TargetContent);
      if (idx === -1) throw new Error(`TargetContent not found for chunk at line ${chunk.StartLine}`);
      if (idx !== targetRegion.lastIndexOf(chunk.TargetContent)) throw new Error(`Multiple occurrences for chunk at line ${chunk.StartLine}`);
      newTargetRegion = targetRegion.replace(chunk.TargetContent, chunk.ReplacementContent);
    }
    
    const before = lines.slice(0, startLine).join('\n');
    const after = lines.slice(endLine).join('\n');
    content = [before, newTargetRegion, after].filter(s => s !== '').join(before ? '\n' : '');
  }
  
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
  return 'Multiple replacements applied successfully.';
};

export const handleListDir = async (args: any, context: vscode.ExtensionContext) => {
  const uri = vscode.Uri.file(args.DirectoryPath);
  const entries = await vscode.workspace.fs.readDirectory(uri);
  return entries.map(([name, type]) => ({
    name,
    isDir: type === vscode.FileType.Directory || type === vscode.FileType.SymbolicLink
  }));
};

export const handleFindByName = async (args: any, context: vscode.ExtensionContext) => {
  let searchPattern = args.Pattern;
  if (!searchPattern.includes('/')) {
    searchPattern = `**/${searchPattern}`;
  }
  const excludePattern = args.Excludes ? `{${args.Excludes.join(',')}}` : undefined;
  
  const uris = await vscode.workspace.findFiles(searchPattern, excludePattern);
  return uris.map(u => u.fsPath);
};

export const handleGrepSearch = async (args: any, context: vscode.ExtensionContext) => {
  let includes = args.Includes ? `{${args.Includes.join(',')}}` : '**/*';
  
  const uris = await vscode.workspace.findFiles(includes, '**/node_modules/**');
  const matches: any[] = [];
  
  const query = args.Query;
  const isRegex = args.IsRegex;
  const caseInsensitive = args.CaseInsensitive;
  const flags = caseInsensitive ? 'i' : '';
  const regex = isRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  
  // Limit to 500 files to avoid hanging
  const searchUris = uris.slice(0, 500);
  
  for (const uri of searchUris) {
    try {
      const data = await vscode.workspace.fs.readFile(uri);
      const content = Buffer.from(data).toString('utf8');
      const lines = content.split('\n');
      
      const fileMatches: any[] = [];
      lines.forEach((line, idx) => {
        if (regex.test(line)) {
          fileMatches.push({
            text: line,
            line: idx + 1
          });
        }
      });
      
      if (fileMatches.length > 0) {
        matches.push({
          filename: uri.fsPath,
          matches: fileMatches
        });
      }
    } catch (e) {
      // Ignore read errors (e.g. binary files)
    }
  }
  
  return matches;
};

export const handleReadUrlContent = async (args: any, context: vscode.ExtensionContext) => {
  return new Promise((resolve, reject) => {
    const client = args.Url.startsWith('https') ? https : http;
    client.get(args.Url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => reject(err));
  });
};

export const handleRunCommand = async (args: any, context: vscode.ExtensionContext) => {
  const terminal = PersistentTerminal.getOrCreate(context);
  terminal.show(true);
  if (args.Cwd) {
    terminal.sendText(`cd "${args.Cwd}"`);
  }
  terminal.sendText(args.CommandLine);
  return `Command sent to terminal "Buddhi AI".`;
};

export const handleManageTask = async (args: any, context: vscode.ExtensionContext) => {
  switch (args.Action) {
    case 'list': return taskRegistry.list();
    case 'kill': return taskRegistry.kill(args.TaskId) ? 'Task killed' : 'Task not found';
    case 'status': return taskRegistry.status(args.TaskId) || 'Task not found';
    case 'send_input': return 'Not implemented for simple tasks';
    default: throw new Error(`Unknown task action: ${args.Action}`);
  }
};

export const handleSchedule = async (args: any, context: vscode.ExtensionContext) => {
  const id = Math.random().toString(36).substring(7);
  let timer: NodeJS.Timeout | null = null;
  
  if (args.DurationSeconds) {
    timer = setTimeout(() => {
      vscode.window.showInformationMessage(`Scheduled task: ${args.Prompt}`);
      taskRegistry.kill(id);
    }, args.DurationSeconds * 1000);
    taskRegistry.register(id, 'once', args.Prompt, timer);
  } else if (args.CronExpression) {
    // simplified implementation of cron: polling every minute for example purposes
    // A real cron would need a cron parser library
    timer = setInterval(() => {
      vscode.window.showInformationMessage(`Cron task triggered: ${args.Prompt}`);
    }, 60000);
    taskRegistry.register(id, 'recurring', args.Prompt, timer);
  }
  
  return `Task scheduled with ID: ${id}`;
};

export const handleListPermissions = async (args: any, context: vscode.ExtensionContext) => {
  return [
    'view_file', 'write_to_file', 'replace_file_content', 'multi_replace_file_content',
    'list_dir', 'find_by_name', 'grep_search', 'read_url_content',
    'run_command', 'manage_task', 'schedule', 'list_permissions', 'ask_permission'
  ];
};
