"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("@secman/process");
describe('ProcessManager', () => {
    it('should report not running initially', () => {
        const pm = new process_1.ProcessManager();
        expect(pm.isRunning()).toBe(false);
    });
    it('should stop a non-running process without error', async () => {
        const pm = new process_1.ProcessManager();
        await pm.stop();
        expect(pm.isRunning()).toBe(false);
    });
    it('should expose getCurrentProcess', () => {
        const pm = new process_1.ProcessManager();
        expect(pm.getCurrentProcess()).toBeNull();
    });
});
//# sourceMappingURL=process.test.js.map