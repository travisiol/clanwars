import { clsx } from "clsx";
import type { ReactNode } from "react";

/** An annotation on the drawing: mono, tracked out, never bold. */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={clsx("type-label text-ink-mute", className)}>{children}</span>;
}

/**
 * Held.
 *
 * The only colour on this page that is not ink is vermilion, and vermilion
 * means war — so a state that is merely waiting has to carry the words
 * instead. It says them in ink with a hairline around it. A screenshot with
 * the animation stopped still reads correctly.
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
        "type-label inline-flex items-center gap-1.5 rounded-full border border-rule-strong px-2.5 py-1 text-ink-soft",
        className,
      )}
    >
      <span className="open-vote h-1.5 w-1.5 rounded-full bg-ink-soft" aria-hidden />
      {children}
    </span>
  );
}

/**
 * Marks the simulated board. Sits inside whatever it labels rather than beside
 * it, so a crop of a screenshot still carries the word.
 */
export function PreviewTag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "type-label inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-paper-lit",
        className,
      )}
    >
      Simulated — not a live board
    </span>
  );
}

/** A figure and its key. */
export function Reading({
  label,
  value,
  held,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  held?: boolean;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <Label>{label}</Label>
      <span className={clsx("type-figure", held ? "text-ink-mute" : "text-ink")}>{value}</span>
      {hint && <span className="type-data text-ink-mute">{hint}</span>}
    </div>
  );
}
