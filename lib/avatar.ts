// Deterministic user-avatar helpers: initials + a stable gradient per user.

/** "Dummy" -> "DU", "Dummy Tester" -> "DT", extra spaces/empty -> "U". */
export const getAvatarInitials = (name?: string | null): string => {
  const words = (typeof name === "string" ? name : "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  const chars = (w: string) => Array.from(w); // safe for non-BMP characters
  if (words.length === 1) return chars(words[0]).slice(0, 2).join("").toUpperCase() || "U";
  return (chars(words[0])[0] + chars(words[1])[0]).toUpperCase() || "U";
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
