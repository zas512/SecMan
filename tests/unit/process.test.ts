import { ProcessManager } from '@secman/process';

describe('ProcessManager', () => {
  it('should report not running initially', () => {
    const pm = new ProcessManager();
    expect(pm.isRunning()).toBe(false);
  });

  it('should stop a non-running process without error', async () => {
    const pm = new ProcessManager();
    await pm.stop();
    expect(pm.isRunning()).toBe(false);
  });

  it('should expose getCurrentProcess', () => {
    const pm = new ProcessManager();
    expect(pm.getCurrentProcess()).toBeNull();
  });
});
