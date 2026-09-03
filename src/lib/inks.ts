/**
 * The twelve banners, in TypeScript because a canvas cannot read a CSS custom
 * property without a layout pass and the map redraws on every hover.
 *
 * These MUST match `--clan-0 … --clan-11` in globals.css. They all read on
 * navy and none of them goes near the yellow-orange band, because gold on
 * this map means one thing — a vote is open on that hex — and a clan the
 * colour of gold would look like it was permanently on fire.
 */
export const INKS = [
  "#e2564a",
  "#e0679c",
  "#b06fd8",
  "#7b7ce8",
  "#3f8ede",
  "#26b3d4",
  "#2eb99b",
  "#4fb45f",
  "#8cbb45",
  "#8e93a8",
  "#c2705f",
  "#5f8fbe",
] as const;

export const VOID = "#081426";
export const FIELD = "#0d2039";
export const FIELD_RAISED = "#122a48";
export const FIELD_LINE = "#1b3a5e";
export const CHALK = "#ffffff";
export const CHALK_SOFT = "#b6c9dd";
export const CHALK_MUTED = "#7d97b3";
export const GOLD = "#f2a71b";
export const GOLD_BRIGHT = "#ffc85a";

export function inkOf(clan: number | null | undefined): string {
  if (clan === null || clan === undefined || clan < 0) return FIELD_LINE;
  return INKS[clan % INKS.length];
}

/** The same banner laid down thinner. */
export function inkWash(clan: number, alpha: number): string {
  return rgba(INKS[clan % INKS.length], alpha);
}

export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
