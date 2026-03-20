// Circular dependency olmadan dashboard ile iletişim için basit event bus
const listeners = [];

export function onLog(fn) {
  listeners.push(fn);
}

export function emitLog(entry) {
  for (const fn of listeners) {
    try { fn(entry); } catch {}
  }
}
