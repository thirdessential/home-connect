/**
 * Runs at most one async task per key at a time. A call for a key that is already running is ignored
 * (resolves `undefined`), and the key is always released afterwards — even if the task throws — so a
 * failed request can never lock a button. Used to stop rapid taps firing duplicate like requests.
 */
export const createInFlightGuard = () => {
  const running = new Set<string>();
  return {
    isRunning: (key: string) => running.has(key),
    async run<T>(key: string, task: () => Promise<T>): Promise<T | undefined> {
      if (running.has(key)) return undefined;
      running.add(key);
      try {
        return await task();
      } finally {
        running.delete(key);
      }
    },
  };
};
