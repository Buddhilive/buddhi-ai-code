interface TaskInfo {
  id: string;
  type: 'once' | 'recurring';
  prompt: string;
  timer: NodeJS.Timeout | null;
}

class TaskRegistry {
  private tasks = new Map<string, TaskInfo>();

  register(id: string, type: 'once' | 'recurring', prompt: string, timer: NodeJS.Timeout | null) {
    this.tasks.set(id, { id, type, prompt, timer });
  }

  kill(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    
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

  list(): TaskInfo[] {
    return Array.from(this.tasks.values());
  }

  status(id: string): TaskInfo | undefined {
    return this.tasks.get(id);
  }
}

export const taskRegistry = new TaskRegistry();
