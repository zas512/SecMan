import { ChildProcess } from 'child_process';
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
export declare class ProcessManager {
    private currentProcess;
    /**
     * Run a command with environment injected
     */
    run(command: string, args: string[], options?: ProcessOptions): Promise<ProcessResult>;
    /**
     * Stop the current running process
     */
    stop(): Promise<void>;
    /**
     * Get the current running process
     */
    getCurrentProcess(): ChildProcess | null;
    /**
     * Check if a process is currently running
     */
    isRunning(): boolean;
}
export declare const processManager: ProcessManager;
export default ProcessManager;
//# sourceMappingURL=index.d.ts.map