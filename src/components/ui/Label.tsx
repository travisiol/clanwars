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
 * The state of the thing: not started yet.
 *
 * Sits inside whatever it labels rather than beside it, so a crop of a
 * screenshot still carries the words. It is the one disclosure this site
 * makes and it is made in plain language — a visitor should be able to tell
 * in one glance that nothing has opened yet, without having to decode a
 * hedge.
 */
export function Awaiting({
  children = "Awaiting launch",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "type-label inline-flex items-center gap-1.5 border border-gold/40 bg-gold/10 px-2 py-1 text-gold",
        className,
      )}
    >
      <span className="open-vote h-1.5 w-1.5 bg-gold" aria-hidden />
      {children}
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
