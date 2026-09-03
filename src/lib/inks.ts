/**
 * The twelve plate inks, in TypeScript because a canvas cannot read a CSS
 * custom property without a layout pass, and the map redraws on every hover.
 *
 * These MUST match `--clan-0 … --clan-11` in globals.css. They are held at
 * roughly one darkness on purpose: a clan is identified by its ink, never
 * ranked by it, and a palette with one bright colour in it would quietly make
 * that clan the protagonist of a map it does not own.
 */
export const INKS = [
  "#7b3b34",
  "#47604f",
  "#3b5a76",
  "#86691f",
  "#63405c",
  "#26635f",
  "#545a3e",
  "#3a4270",
  "#7a5630",
  "#55606b",
  "#56504a",
  "#6e3f52",
] as const;

export const PAPER = "#efeae0";
export const PAPER_LIT = "#f7f4ec";
export const PAPER_DEEP = "#e3dcce";
export const PAPER_SUNK = "#d8d0c0";
export const INK = "#1a1d24";
export const INK_MUTE = "#5d6168";
export const WAR = "#b23a22";

export function inkOf(clan: number | null | undefined): string {
  if (clan === null || clan === undefined || clan < 0) return PAPER_DEEP;
  return INKS[clan % INKS.length];
}

/** The same ink laid down thinner, for a hex that is not the subject. */
export function inkWash(clan: number, alpha: number): string {
  const hex = INKS[clan % INKS.length];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
