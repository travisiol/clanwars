import { clsx } from "clsx";
import type { ReactNode } from "react";

/** A key on the sheet: mono, tracked out, uppercase. */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={clsx("type-label text-chalk-muted", className)}>{children}</span>;
}

/**
 * Marks the board as a played simulation rather than a chain reading.
 *
 * Sits inside whatever it labels rather than beside it, so a crop of a
 * screenshot still carries the word. Nothing is deployed; every figure on
 * this site comes out of a season played by the rules, and the moment that
 * stops being said clearly the rest of the numbers stop being worth
 * anything.
 */
export function SimTag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "type-label inline-flex items-center gap-1.5 border border-gold/40 bg-gold/10 px-2 py-1 text-gold",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 bg-gold" />
      Simulated season
    </span>
  );
}

/** A figure and its key, the way the sheets carry them. */
export function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: string;
  hint?: string;
}) {
  return (
    <div title={hint}>
      <Label className="block">{label}</Label>
      <p className={clsx("type-figure-sm mt-1.5", tone ?? "text-chalk")}>{value}</p>
    </div>
  );
}
