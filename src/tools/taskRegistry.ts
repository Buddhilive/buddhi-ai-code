import { ChildProcess } from 'child_process';
import * as vscode from 'vscode';

export interface TaskInfo {
  id: string;
  command?: string;
  status?: 'running' | 'completed' | 'error' | 'killed';
  stdout?: string;
  stderr?: string;
  process?: ChildProcess;
  exitCode?: number | null;
  type?: 'once' | 'recurring';
  prompt?: string;
  timer?: NodeJS.Timeout | null;
}

class TaskRegistry {
  private tasks = new Map<string, TaskInfo>();

  registerTimer(id: string, type: 'once' | 'recurring', prompt: string, timer: NodeJS.Timeout | null) {
    this.tasks.set(id, { id, type, prompt, timer });
  }

  registerProcess(id: string, command: string, process: ChildProcess) {
    const task: TaskInfo = {
      id,
      command,
      status: 'running',
      stdout: '',
      stderr: '',
      process
    };

    if (process.stdout) {
      process.stdout.on('data', (data) => {
        task.stdout += data.toString();
        // Notify webview to update scratchpad? For Phase 1 we just store it.
      });
    }

    if (process.stderr) {
      process.stderr.on('data', (data) => {
        task.stderr += data.toString();
      });
    }

    process.on('close', (code) => {
      task.status = code === 0 ? 'completed' : 'error';
      task.exitCode = code;
      // Truncate output if too long
      const MAX_LEN = 50000;
      if (task.stdout && task.stdout.length > MAX_LEN) {
        task.stdout = task.stdout.substring(task.stdout.length - MAX_LEN);
      }
    });

    this.tasks.set(id, task);
    return task;
  }

  kill(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    if (task.process && task.status === 'running') {
      task.process.kill();
      task.status = 'killed';
    }
    
    if (task.timer) {
      if (task.type === 'once') {
        clearTimeout(task.timer);
      } else {
        clearInterval(task.timer);
      }
    }
    
    this.tasks.delete(id);
    return true;
  }

  list(): Omit<TaskInfo, 'process'>[] {
    return Array.from(this.tasks.values()).map(({ process, ...rest }) => rest);
  }

  status(id: string): Omit<TaskInfo, 'process'> | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const { process, ...rest } = task;
    return rest;
  }
}

export const taskRegistry = new TaskRegistry();
