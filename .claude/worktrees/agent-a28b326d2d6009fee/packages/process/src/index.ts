// Process module for SecMan
// Handles process spawning, environment injection, signal forwarding

import { spawn, ChildProcess } from 'child_process';

export interface ProcessOptions {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  signal?: string;
  timeout?: number;
}

export interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export class ProcessManager {
  private currentProcess: ChildProcess | null = null;

  /**
   * Run a command with environment injected
   */
  async run(command: string, args: string[], options: ProcessOptions = {}): Promise<ProcessResult> {
    const startTime = Date.now();
    const { env = {}, cwd, signal } = options;

    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...env },
        stdio: 'pipe',
        shell: true
      });

      this.currentProcess = child;

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        this.currentProcess = null;
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
          duration: Date.now() - startTime
        });
      });

      child.on('error', (error) => {
        this.currentProcess = null;
        reject(error);
      });

      // Handle signals for graceful shutdown
      const handleSignal = async (sig: NodeJS.Signals) => {
        if (this.currentProcess) {
          this.currentProcess.kill(sig);
        }
        process.kill(process.pid, sig);
      };

      if (signal) {
        process.on(signal as any, () => handleSignal(signal as NodeJS.Signals));
      }
    });
  }

  /**
   * Stop the current running process
   */
  async stop(): Promise<void> {
    if (this.currentProcess) {
      this.currentProcess.kill('SIGTERM');
      this.currentProcess = null;
    }
  }

  /**
   * Get the current running process
   */
  getCurrentProcess(): ChildProcess | null {
    return this.currentProcess;
  }

  /**
   * Check if a process is currently running
   */
  isRunning(): boolean {
    return this.currentProcess !== null;
  }
}

export const processManager = new ProcessManager();
export default ProcessManager;