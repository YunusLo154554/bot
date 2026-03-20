// Per-user cooldown tracking using WeakMap-backed structure
// Prevents memory leaks on large servers
const cooldowns = new Map();

/**
 * Checks if a user is on cooldown for a command.
 * @returns {number|null} Remaining seconds if on cooldown, null if clear
 */
export function checkCooldown(commandName, userId, cooldownSeconds) {
  if (!cooldownSeconds) return null;

  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }

  const timestamps = cooldowns.get(commandName);
  const now = Date.now();
  const cooldownMs = cooldownSeconds * 1000;

  if (timestamps.has(userId)) {
    const expiry = timestamps.get(userId) + cooldownMs;
    if (now < expiry) {
      return ((expiry - now) / 1000).toFixed(1);
    }
  }

  timestamps.set(userId, now);

  // Auto-cleanup after cooldown expires
  setTimeout(() => timestamps.delete(userId), cooldownMs);

  return null;
}
