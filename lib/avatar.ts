// Deterministic user-avatar helpers: initials + a stable gradient per user.

/**
 * Initials from a display name — the single shared rule.
 * 2+ words -> first letter of first + last word ("Amit Kumar Sharma" -> "AS");
 * 1 word -> one letter ("hello" -> "H"); extra spaces ignored.
 * Returns "" when there is no usable name, so callers show the generic default avatar.
 */
export const getAvatarInitials = (name?: string | null): string => {
  const chars = (w: string) => Array.from(w); // safe for non-BMP characters
  const words = (typeof name === "string" ? name : "")
    .trim()
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (!words.length) return "";
  const lead = (w: string) => (chars(w.replace(/^[^\p{L}\p{N}]+/u, ""))[0] ?? "").toUpperCase();
  if (words.length === 1) return lead(words[0]);
  return lead(words[0]) + lead(words[words.length - 1]);
};

// All pairs keep white text at >= ~4:1 contrast (mid/dark tones only).
const GRADIENTS: readonly [string, string][] = [
  // ["#6366F1", "#8B5CF6"],
  // ["#EC4899", "#F43F5E"],
  // ["#F97316", "#DC2626"],
  // ["#0EA5E9", "#2563EB"],
  ["#15803D", "#000602"],
  // ["#22C55E", "#15803D"],
  // ["#A855F7", "#DB2777"],
  // ["#0284C7", "#4F46E5"],
  // ["#D97706", "#B45309"],
  // ["#E11D48", "#9F1239"],
  // ["#059669", "#0D9488"],
  // ["#7C3AED", "#2563EB"],
  // ["#EA580C", "#BE123C"],
  // ["#0891B2", "#047857"],
  // ["#C026D3", "#6D28D9"],
  // ["#475569", "#1E293B"],
];

// FNV-1a: same input -> same output on every device and app restart.
const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Stable gradient for a user id (falls back to the name when no id). */
export const getAvatarGradient = (seed?: string | null): [string, string] => {
  const [a, b] = GRADIENTS[hash(seed || "user") % GRADIENTS.length];
  return [a, b];
};
