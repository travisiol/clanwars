import { clsx } from "clsx";
import type { CSSProperties } from "react";
import { INKS, rgba } from "@/lib/inks";
import { SEATS_PER_CLAN } from "@/lib/rules";

/**
 * Fifty seats, drawn.
 *
 * The product rendered literally: ten across, five down, one square per seat,
 * and the whole thing fits in the corner of a sheet. It is the only place on
 * the site that shows a quantity as a shape rather than a number, and it
 * earns that because fifty is small enough to count by eye — which is exactly
 * the property the cap exists to give the game.
 *
 * Three states and no fourth:
 *   taken      — solid banner colour.
 *   committed  — outline only. The seat voted this epoch and is spent.
 *   empty      — a hairline on the void. Recruiting is the whole late game.
 */
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
  ink: number | null;
  cell?: number;
  className?: string;
  label?: string;
}) {
  const colour = ink === null ? "#f2a71b" : INKS[ink % INKS.length];
  const seats = Array.from({ length: SEATS_PER_CLAN }, (_, i) => i);

  return (
    <div
      className={clsx("grid gap-[3px]", className)}
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
            style={{
              width: cell,
              height: cell,
              background: taken && !spent ? colour : "transparent",
              boxShadow: taken
                ? spent
                  ? `inset 0 0 0 ${Math.max(1.5, cell * 0.16)}px ${colour}`
                  : "none"
                : `inset 0 0 0 1px ${rgba("#8cb9e6", 0.34)}`,
            }}
          />
        );
      })}
    </div>
  );
}

/** The key for the roster. Rendered once per surface, not once per roster. */
export function RosterKey({ ink }: { ink: number | null }) {
  const colour = ink === null ? "#f2a71b" : INKS[ink % INKS.length];
  const item = (style: CSSProperties, text: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5" style={style} />
      <span className="type-label text-chalk-muted">{text}</span>
    </span>
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {item({ background: colour }, "Taken")}
      {item({ boxShadow: `inset 0 0 0 2px ${colour}` }, "Committed")}
      {item({ boxShadow: `inset 0 0 0 1px ${rgba("#8cb9e6", 0.34)}` }, "Empty")}
    </div>
  );
}
