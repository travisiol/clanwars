/**
 * The twelve clans, and the one correlation that matters.
 *
 * The table is sorted by ground held, which makes it look like a leaderboard,
 * so the column that follows it is turnout — the share of a clan's seats that
 * answers a muster. Read the two together and the whole game is on one screen:
 * the clans at the bottom are not the poorest, they are the quietest.
 *
 * That is a claim about the data, so it is computed underneath the table
 * rather than written into a paragraph. If a change to the rules ever breaks
 * the correlation, the sentence changes with it.
 */

import { Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import { formatEth } from "@/lib/economics";
import { INKS } from "@/lib/inks";
import { SEATS_PER_CLAN } from "@/lib/rules";

export function Ledger() {
  const b = board();

  /* Quietest three against loudest three, on ground lost. Computed, not said. */
  const byTurnout = [...b.clans].sort((x, y) => x.discipline - y.discipline);
  const quiet = byTurnout.slice(0, 3);
  const loud = byTurnout.slice(-3);
  const lost = (rows: typeof quiet) => rows.reduce((n, c) => n + c.overrun, 0);

  return (
    <div className="min-w-0">
      {/* The table sets a min width, so every ancestor that is a grid or flex
          child needs min-w-0 or the whole page gets 400px of horizontal scroll
          on a phone from one element that was supposed to scroll on its own. */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-rule-strong text-left">
              {[
                "Clan",
                "Seats",
                "Hexes",
                "Turnout",
                "Per seat / day",
                "Season take",
                "Attacks w–l",
                "Held / lost",
                "Room",
              ].map((h, i) => (
                <th
                  key={h}
                  className={`type-label py-2.5 font-normal text-chalk-muted ${i > 0 ? "text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.clans.map((c) => (
              <tr key={c.id} className="border-b border-rule">
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0"
                      style={{ background: INKS[c.ink], borderRadius: 1 }}
                      aria-hidden
                    />
                    <span className="type-data text-chalk">{c.name}</span>
                    <span className="type-data text-chalk-muted">{c.tag}</span>
                  </span>
                </td>
                <td className="type-data py-2.5 text-right text-chalk">
                  {c.seats}
                  <span className="text-chalk-muted">/{SEATS_PER_CLAN}</span>
                </td>
                <td className="type-data py-2.5 text-right text-chalk">
                  {c.hexes}
                  <span className="text-chalk-muted">/{c.capacity}</span>
                </td>
                <td className="type-data py-2.5 text-right text-chalk">
                  {Math.round(c.discipline * 100)}%
                </td>
                <td className="type-data py-2.5 text-right text-chalk">
                  {formatEth(c.perSeat, 4)}
                </td>
                <td className="type-data py-2.5 text-right text-chalk-soft">
                  {formatEth(c.treasury, 2)}
                </td>
                <td className="type-data py-2.5 text-right text-chalk-soft">
                  {c.wonAttacks}–{c.lostAttacks}
                </td>
                <td className="type-data py-2.5 text-right text-chalk-soft">
                  {c.heldOff}
                  <span className="text-chalk-muted"> / </span>
                  <span className={c.overrun > 4 ? "text-loss" : undefined}>{c.overrun}</span>
                </td>
                <td className="type-data py-2.5 text-right text-chalk-muted">{c.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <p className="type-body max-w-[62ch] text-chalk-soft">
          The three quietest clans — {quiet.map((c) => c.tag).join(", ")}, answering{" "}
          {Math.round((quiet.reduce((n, c) => n + c.discipline, 0) / 3) * 100)}% of a muster —
          lost <span className="text-chalk">{lost(quiet)} hexes</span> between them this season.
          The three loudest — {loud.map((c) => c.tag).join(", ")}, at{" "}
          {Math.round((loud.reduce((n, c) => n + c.discipline, 0) / 3) * 100)}% — lost{" "}
          <span className="text-chalk">{lost(loud)}</span>. Both groups hold their ground on the
          same rules and pay the same fee. The difference is who is in the chat.
        </p>
        <p className="type-data text-chalk-muted sm:text-right">
          Rooms are named by their clans.
          <br />
          Nothing here resolves to a real one yet.
        </p>
      </div>
      <div className="mt-4">
        <Label>Simulated season, epoch {b.epoch}</Label>
      </div>
    </div>
  );
}
