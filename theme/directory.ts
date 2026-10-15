// Design tokens for the Directory redesign.
export const dir = {
  green: "#0F3D26",
  lime: "#C9DE47",
  ground: "#F5F7F0",
  ink: "#10261B",
  muted: "#55645A",
  border: "#E3E8DD",
  rowBorder: "#E8ECE2",
  greenText: "#1B6B3A",
  star: "#F5B301",
  soft: "#C5D6CB",
  radius: { card: 22, society: 28, pill: 25, tile: 20 },
  font: {
    medium: "PlusJakartaSans_500Medium",
    semi: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
    extra: "PlusJakartaSans_800ExtraBold",
  },
  // Category tints for provider avatars/tags (bg, fg).
  tints: [
    { bg: "#E4F0A8", fg: "#0F3D26", tagBg: "#EEF6E4", tagFg: "#1B6B3A" },
    { bg: "#D9E9F4", fg: "#123B57", tagBg: "#E8F1F8", tagFg: "#123B57" },
    { bg: "#F8E1D2", fg: "#6B2F12", tagBg: "#FBEEE5", tagFg: "#6B2F12" },
    { bg: "#D6EBDD", fg: "#0F3D26", tagBg: "#E6F3EA", tagFg: "#1B6B3A" },
  ],
} as const;

export const tintFor = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return dir.tints[h % dir.tints.length];
};
