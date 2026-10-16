const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Caps scripted durations when the user prefers reduced motion. */
export function motionMs(ms: number): number {
  return prefersReducedMotion ? Math.min(ms, 40) : ms;
}

export function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Resolves on the next animation frame, so a previous commit has been styled. */
export function nextFrame(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      cancelAnimationFrame(frame);
      reject(signal.reason);
    };
    const frame = requestAnimationFrame(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    });
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Awaits a promise that can't be cancelled itself, then bails out if the signal fired meanwhile. */
export async function settle<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  const value = await promise;
  signal.throwIfAborted();
  return value;
}
