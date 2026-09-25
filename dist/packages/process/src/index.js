"use strict";
// Process module for SecMan
// Handles process spawning, environment injection, signal forwarding
Object.defineProperty(exports, "__esModule", { value: true });
exports.processManager = exports.ProcessManager = void 0;
const child_process_1 = require("child_process");
class ProcessManager {
    constructor() {
        this.currentProcess = null;
    }
    /**
     * Run a command with environment injected
     */
    async run(command, args, options = {}) {
        const startTime = Date.now();
        const { env = {}, cwd, signal } = options;
        return new Promise((resolve, reject) => {
            const timeoutMs = options.timeout || 30000;
            const timeoutId = setTimeout(() => {
                child.kill('SIGTERM');
                reject(new Error(`Process timeout after ${timeoutMs}ms`));
            }, timeoutMs);
            const child = (0, child_process_1.spawn)(command, args, {
                cwd,
                env: { ...process.env, ...env },
                stdio: 'pipe',
                shell: false // Avoid shell-based execution unless specifically required
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
                clearTimeout(timeoutId);
                this.currentProcess = null;
                resolve({
                    exitCode: code || 0,
                    stdout,
                    stderr,
                    duration: Date.now() - startTime
                });
            });
            child.on('error', (error) => {
                clearTimeout(timeoutId);
                this.currentProcess = null;
                reject(error);
            });
            // Handle signals for graceful shutdown
            const handleSignal = async (sig) => {
                if (this.currentProcess) {
                    this.currentProcess.kill(sig);
                }
                process.kill(process.pid, sig);
            };
            if (signal) {
                process.on(signal, () => handleSignal(signal));
            }
        });
    }
    /**
     * Stop the current running process
     */
    async stop() {
        if (this.currentProcess) {
            this.currentProcess.kill('SIGTERM');
            this.currentProcess = null;
        }
    }
    /**
     * Get the current running process
     */
    getCurrentProcess() {
        return this.currentProcess;
    }
    /**
     * Check if a process is currently running
     */
    isRunning() {
        return this.currentProcess !== null;
    }
}
exports.ProcessManager = ProcessManager;
exports.processManager = new ProcessManager();
exports.default = ProcessManager;
//# sourceMappingURL=index.js.map