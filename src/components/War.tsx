"use client";

/**
 * A war, in the twelve hours before it happens.
 *
 * The most important thing on this site is that this object can exist at all:
 * the attack is public while it is still a vote. Both sides read the same two
 * bars for half a day, and the hex goes to whichever of them got more of its
 * fifty out of bed.
 *
 * So it is drawn as a comparison and never as a countdown to a reveal. Both
 * bars sit on ONE scale — a defence drawn on its own axis is the classic way
 * to make a losing position look survivable — and the verdict underneath is
 * stated in the only unit either side can act on: seats, one integer, the
 * thing a member can personally change by turning up.
 */

import { clsx } from "clsx";
import { Roster } from "@/components/Roster";
import { Label } from "@/components/ui/Label";
import { board, type OpenWar } from "@/lib/board";
import { formatWindow, plural } from "@/lib/format";
import { INKS, rgba } from "@/lib/inks";
import { DUG_IN_CAP, MUSTER_HOURS, resolve, seatsToBreak } from "@/lib/rules";

function Bar({
  segments,
  scale,
}: {
  segments: { value: number; colour: string; hatched?: boolean; title: string }[];
  scale: number;
}) {
  return (
    <div className="flex h-5 w-full overflow-hidden border border-rule bg-void">
      {segments.map((s, i) => (
        <span
          key={i}
          title={s.title}
          style={{
            width: `${(s.value / scale) * 100}%`,
            background: s.hatched
              ? `repeating-linear-gradient(135deg, ${s.colour} 0 3px, transparent 3px 6px)`
              : s.colour,
          }}
        />
      ))}
    </div>
  );
}

/** The two bars and the verdict. Used on the hex sheet and in the overlay. */
export function WarBars({ w }: { w: OpenWar }) {
  const b = board();
  const attacker = b.clans.find((c) => c.id === w.attacker)!;
  const defender = b.clans.find((c) => c.id === w.defender)!;
  const held = b.held[w.hex];
  const dug = Math.min(held, DUG_IN_CAP);
  const out = resolve({ yes: w.yes, heldEpochs: held, mustered: w.mustered });
  const scale = Math.max(out.attack, out.defence, 1);
  const needed = seatsToBreak(held, w.mustered);

  return (
    <div>
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <Label>Attack — {attacker.tag} seats voted yes</Label>
            <span className="type-data text-chalk">{out.attack}</span>
          </div>
          <Bar
            scale={scale}
            segments={[
              {
                value: out.attack,
                colour: INKS[attacker.ink],
                title: `${out.attack} seats committed`,
              },
            ]}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <Label>Defence — dug in + {defender.tag} answered</Label>
            <span className="type-data text-chalk">{out.defence}</span>
          </div>
          <Bar
            scale={scale}
            segments={[
              {
                value: dug,
                colour: INKS[defender.ink],
                hatched: true,
                title: `${dug} from holding the ground`,
              },
              {
                value: w.mustered,
                colour: INKS[defender.ink],
                title: `${w.mustered} seats answered the muster`,
              },
            ]}
          />
        </div>
      </div>

      <p className="type-body mt-4 text-chalk-soft">
        {out.taken ? (
          <>
            As it stands the hex falls.{" "}
            <span className="text-gold">
              {defender.tag} needs {out.attack - dug - w.mustered + 1} more{" "}
              {plural(out.attack - dug - w.mustered + 1, "seat")} at the muster
            </span>{" "}
            before the window closes — it has {defender.seats - w.mustered} that have not
            answered.
          </>
        ) : (
          <>
            As it stands the hex holds.{" "}
            <span className="text-gold">
              {attacker.tag} needs {needed - out.attack} more{" "}
              {plural(needed - out.attack, "vote")}
            </span>{" "}
            — and every seat it spends here is a seat it cannot spend anywhere else this
            epoch.
          </>
        )}
      </p>
    </div>
  );
}

/** The full card, for the overlay. Bars plus both rosters. */
export function WarCard({ w }: { w: OpenWar }) {
  const b = board();
  const attacker = b.clans.find((c) => c.id === w.attacker)!;
  const defender = b.clans.find((c) => c.id === w.defender)!;
  const held = b.held[w.hex];

  return (
    <article className="border border-gold/35 bg-gold/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-gold">Vote open</Label>
          <h3 className="type-title mt-2 text-chalk">
            {attacker.name} <span className="text-chalk-muted">on</span> {defender.name}
          </h3>
          <p className="type-data mt-1 text-chalk-muted">
            Hex {String(w.hex).padStart(3, "0")} · held {held} {plural(held, "day")} · dug in{" "}
            {Math.min(held, DUG_IN_CAP)}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="open-vote h-1.5 w-1.5 bg-gold" aria-hidden />
          <span className="type-data text-gold">{formatWindow(w.minutesLeft)}</span>
        </span>
      </div>

      <div className="mt-5">
        <WarBars w={w} />
      </div>

      <div className="mt-5 flex flex-wrap gap-6 border-t border-rule pt-4">
        <div>
          <Label>
            {attacker.tag} — {attacker.seats} seats
          </Label>
          <Roster
            className="mt-2"
            ink={attacker.ink}
            filled={attacker.seats}
            committed={w.yes}
            cell={8}
            label={`${attacker.name}: ${w.yes} of ${attacker.seats} seats committed to this attack`}
          />
        </div>
        <div>
          <Label>
            {defender.tag} — {defender.seats} seats
          </Label>
          <Roster
            className="mt-2"
            ink={defender.ink}
            filled={defender.seats}
            committed={w.mustered}
            cell={8}
            label={`${defender.name}: ${w.mustered} of ${defender.seats} seats answered`}
          />
        </div>
      </div>
    </article>
  );
}

/** What the season already settled. */
export function WarList({ limit = 8 }: { limit?: number }) {
  const b = board();
  return (
    <div className="border border-rule">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule px-4 py-3">
        <Label className="text-chalk">Settled — the last of the season</Label>
        <span className="type-data text-chalk-muted">
          attack v. defence, {MUSTER_HOURS}-hour window
        </span>
      </div>
      <ul className="divide-y divide-rule">
        {b.battles.slice(0, limit).map((x, i) => {
          const a = b.clans.find((c) => c.id === x.attacker)!;
          const d = b.clans.find((c) => c.id === x.defender)!;
          return (
            <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
              <span className="type-data w-8 shrink-0 text-chalk-muted">d{x.epoch}</span>
              <span className="type-data flex min-w-0 flex-1 items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0"
                  style={{ background: rgba(INKS[a.ink], 1) }}
                  aria-hidden
                />
                <span className="text-chalk">{a.tag}</span>
                <span className="text-chalk-muted">on</span>
                <span
                  className="h-2 w-2 shrink-0"
                  style={{ background: rgba(INKS[d.ink], 1) }}
                  aria-hidden
                />
                <span className="text-chalk">{d.tag}</span>
                <span className="truncate text-chalk-muted">
                  hex {String(x.hex).padStart(3, "0")}
                </span>
              </span>
              <span className="type-data shrink-0 text-chalk-muted">
                <span className="text-chalk">{x.attack}</span> v{" "}
                <span className="text-chalk">{x.defence}</span>
                <span className="ml-1">
                  ({x.dugIn}+{x.mustered})
                </span>
              </span>
              <span
                className={clsx(
                  "type-label ml-auto shrink-0",
                  x.taken ? "text-loss" : "text-chalk-muted",
                )}
              >
                {x.taken ? "Taken" : "Held"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
