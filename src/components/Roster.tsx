/**
 * Fifty seats, drawn.
 *
 * This is the product rendered literally: ten across, five down, one square
 * per seat, and the whole thing fits in the corner of a card. It is the only
 * component on the site that shows a quantity as a shape rather than a
 * number, and it earns that because fifty is small enough to count by eye —
 * which is exactly the property the cap exists to give the game.
 *
 * Three states and no fourth:
 *   taken      — solid clan ink.
 *   empty      — a hairline square. Recruiting is the whole late game.
 *   committed  — taken, with the paper showing through. The seat voted this
 *                epoch and cannot vote again until seats refresh.
 */

import { clsx } from "clsx";
import type { CSSProperties } from "react";
import { INKS } from "@/lib/inks";
import { SEATS_PER_CLAN } from "@/lib/rules";

export function Roster({
  filled,
  committed = 0,
  ink,
  cell = 12,
  className,
  label,
}: {
  filled: number;
  /** Of the filled seats, how many are spent this epoch. */
  committed?: number;
  /** Index into the plate inks, or null for a roster with no clan. */
  ink: number | null;
  cell?: number;
  className?: string;
  label?: string;
}) {
  const colour = ink === null ? "var(--ink)" : INKS[ink % INKS.length];
  const seats = Array.from({ length: SEATS_PER_CLAN }, (_, i) => i);

  return (
    <div className={clsx("inline-flex flex-col gap-2", className)}>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(10, ${cell}px)` }}
        role="img"
        aria-label={
          label ??
          `${filled} of ${SEATS_PER_CLAN} seats taken, ${committed} of them committed this epoch`
        }
      >
        {seats.map((i) => {
          const taken = i < filled;
          const spent = taken && i < committed;
          return (
            <span
              key={i}
              className="seat"
              style={{
                width: cell,
                height: cell,
                background: taken && !spent ? colour : "transparent",
                boxShadow: taken
                  ? spent
                    ? `inset 0 0 0 ${Math.max(1.5, cell * 0.19)}px ${colour}`
                    : "none"
                  : "inset 0 0 0 1px var(--rule-strong)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** The key for the roster. Rendered once per page, not once per roster. */
export function RosterKey({ ink }: { ink: number | null }) {
  const colour = ink === null ? "var(--ink)" : INKS[ink % INKS.length];
  const item = (style: CSSProperties, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className="seat h-2.5 w-2.5" style={style} />
      <span className="type-label text-ink-mute">{text}</span>
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {item({ background: colour }, "Taken")}
      {item({ boxShadow: `inset 0 0 0 2px ${colour}` }, "Committed")}
      {item({ boxShadow: "inset 0 0 0 1px var(--rule-strong)" }, "Empty")}
    </div>
  );
}
