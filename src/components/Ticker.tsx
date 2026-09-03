"use client";

import { board } from "@/lib/board";
import { formatEth } from "@/lib/economics";
import { plural } from "@/lib/format";
import { HEX_COUNT } from "@/lib/hex";
import { SEATS_PER_CLAN, holdCapacity } from "@/lib/rules";

/*
 * The strip along the bottom.
 *
 * Every line is a reading off the played season or a constant out of the
 * rules — no invented volume, no invented holders. It is the one place on
 * the site where the state of the world is stated in sentences rather than
 * figures, which is what a visitor needs in the four seconds before they
 * touch the map.
 */
export function Ticker() {
  const b = board();
  const quietest = [...b.clans].sort((x, y) => x.discipline - y.discipline)[0];

  const lines = [
    `${b.ownedHexes} of ${HEX_COUNT} hexes held, ${b.neutralHexes} still grass`,
    `${b.totalSeats} seats taken across ${b.clans.length} clans`,
    `Every hex pays ${formatEth(b.perHex, 4)} ETH a day — all ${HEX_COUNT} the same`,
    "Fees are split by seat, not by balance",
    `A full clan holds ${holdCapacity(SEATS_PER_CLAN)} hexes; the board fits eight of them`,
    `${b.wars.length} war ${plural(b.wars.length, "vote")} open right now`,
    `${quietest.tag} answers ${Math.round(quietest.discipline * 100)}% of a muster and has been overrun ${quietest.overrun} times`,
    "Every attack is public for twelve hours before it lands",
  ];

  return (
    <div className="flex items-stretch border-t border-rule bg-void">
      <span className="flex shrink-0 items-center gap-2 border-r border-rule px-4 py-2.5">
        <span className="h-2 w-2 bg-gold" />
        <span className="type-label text-gold">Simulated</span>
      </span>

      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-ticker">
          {/* Two copies so the loop has something to scroll into. */}
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {lines.map((line) => (
                <li key={line} className="flex items-center gap-4 whitespace-nowrap px-6 py-2.5">
                  <span className="type-data text-chalk-soft">{line}</span>
                  <span aria-hidden className="text-gold/50">
                    ·
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <span className="hidden shrink-0 items-center border-l border-rule px-4 py-2.5 sm:flex">
        <span className="type-label text-chalk-muted">
          {b.ownedHexes} / {HEX_COUNT} held
        </span>
      </span>
    </div>
  );
}
