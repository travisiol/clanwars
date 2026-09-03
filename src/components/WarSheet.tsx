/**
 * A war, in the twelve hours before it happens.
 *
 * The single most important design decision on this site is that this card
 * can exist at all: the attack is public while it is still being voted on.
 * Both sides see the same numbers, the defender has half a day to answer, and
 * the outcome is settled by which group chat got more people out of bed.
 *
 * So the card is drawn as a comparison and never as a countdown to a reveal.
 * Both bars sit on one scale — a defence drawn on its own axis is the classic
 * way to make a losing position look survivable — and the verdict underneath
 * is stated in the only unit either side can act on: seats, one integer, the
 * thing a member can personally change by turning up.
 */

import { clsx } from "clsx";
import { Roster } from "@/components/Roster";
import { Label } from "@/components/ui/Label";
import { board, type OpenWar } from "@/lib/board";
import { formatWindow, plural } from "@/lib/format";
import { INKS } from "@/lib/inks";
import { DUG_IN_CAP, MUSTER_HOURS, resolve, seatsToBreak } from "@/lib/rules";

function Bar({
  segments,
  scale,
  className,
}: {
  segments: { value: number; colour: string; hatched?: boolean; title: string }[];
  scale: number;
  className?: string;
}) {
  return (
    <div className={clsx("flex h-6 w-full overflow-hidden bg-paper-sunk", className)}>
      {segments.map((s, i) => (
        <span
          key={i}
          title={s.title}
          style={{
            width: `${(s.value / scale) * 100}%`,
            background: s.hatched
              ? `repeating-linear-gradient(135deg, ${s.colour} 0 3px, transparent 3px 6px)`
              : s.colour,
            boxShadow: s.hatched ? `inset 0 0 0 1px ${s.colour}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/**
 * One war. The compact form drops the two rosters and the settled-battle
 * context, because in the hero it has one job — show that this thing exists —
 * and the numbers it keeps are the same numbers.
 */
export function WarCard({ w, compact = false }: { w: OpenWar; compact?: boolean }) {
  const b = board();
  const attacker = b.clans.find((c) => c.id === w.attacker)!;
  const defender = b.clans.find((c) => c.id === w.defender)!;
  const held = b.held[w.hex];
  const out = resolve({ yes: w.yes, heldEpochs: held, mustered: w.mustered });
  const scale = Math.max(out.attack, out.defence, 1);
  const needed = seatsToBreak(held, w.mustered);

  return (
    <article className={clsx("sheet-war", compact ? "p-4 sm:p-5" : "p-5")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label>Vote open</Label>
          <h3 className="type-head mt-1.5 text-ink">
            {attacker.name} <span className="text-ink-mute">on</span> {defender.name}
          </h3>
          <p className="type-data mt-1 text-ink-mute">
            Hex {String(w.hex).padStart(3, "0")} · held {held} {plural(held, "day")} · dug in{" "}
            {Math.min(held, DUG_IN_CAP)}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <span className="open-vote h-1.5 w-1.5 rounded-full bg-war" aria-hidden />
          <span className="type-data tnum text-war">{formatWindow(w.minutesLeft)}</span>
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="type-label text-ink-mute">
              Attack — {attacker.tag} seats voted yes
            </span>
            <span className="type-data text-ink">{out.attack}</span>
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
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="type-label text-ink-mute">
              Defence — dug in + {defender.tag} seats answered
            </span>
            <span className="type-data text-ink">{out.defence}</span>
          </div>
          <Bar
            scale={scale}
            segments={[
              {
                value: Math.min(held, DUG_IN_CAP),
                colour: INKS[defender.ink],
                hatched: true,
                title: `${Math.min(held, DUG_IN_CAP)} from holding the ground`,
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

      <p className="type-body mt-4 text-ink-soft">
        {out.taken ? (
          <>
            As it stands the hex falls.{" "}
            <span className="text-ink">
              {defender.tag} needs {out.attack - Math.min(held, DUG_IN_CAP) - w.mustered + 1}{" "}
              more {plural(out.attack - Math.min(held, DUG_IN_CAP) - w.mustered + 1, "seat")} at
              the muster
            </span>{" "}
            before the window closes — it has {defender.seats - w.mustered} not yet answered.
          </>
        ) : (
          <>
            As it stands the hex holds.{" "}
            <span className="text-ink">
              {attacker.tag} needs {needed - out.attack} more{" "}
              {plural(needed - out.attack, "vote")}
            </span>{" "}
            — and every seat it spends here is a seat it cannot spend anywhere else this
            epoch.
          </>
        )}
      </p>

      {!compact && (
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
      )}
    </article>
  );
}

export function WarSheet() {
  const b = board();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {b.wars.map((w) => (
        <WarCard key={`${w.attacker}-${w.hex}`} w={w} />
      ))}

      <div className="sheet p-5 lg:col-span-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Label>Settled — the last of the season</Label>
          <span className="type-data text-ink-mute">
            attack v. defence, {MUSTER_HOURS}-hour window
          </span>
        </div>
        <ul className="mt-3 divide-y divide-rule">
          {b.battles.slice(0, 8).map((x, i) => {
            const a = b.clans.find((c) => c.id === x.attacker)!;
            const d = b.clans.find((c) => c.id === x.defender)!;
            return (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="type-data w-8 shrink-0 text-ink-mute">d{x.epoch}</span>
                <span className="type-data flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-ink">{a.tag}</span>
                  <span className="text-ink-mute">on</span>
                  <span className="text-ink">{d.tag}</span>
                  <span className="truncate text-ink-mute">
                    hex {String(x.hex).padStart(3, "0")}
                  </span>
                </span>
                <span className="type-data shrink-0 text-ink-mute">
                  <span className="text-ink">{x.attack}</span> v{" "}
                  <span className="text-ink">{x.defence}</span>
                  <span className="ml-1">
                    ({x.dugIn}+{x.mustered})
                  </span>
                </span>
                <span
                  className={clsx(
                    "type-label ml-auto shrink-0 text-right",
                    x.taken ? "text-war" : "text-ink-mute",
                  )}
                >
                  {x.taken ? "Taken" : "Held"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
