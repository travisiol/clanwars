"use client";

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
  /*
   * Rules and rates, not events. The strip is the first thing a visitor reads
   * and it has one job: say what the game is and how it pays, in sentences
   * short enough to catch out of the corner of an eye. Nothing here claims
   * anybody has done anything yet — the chip on the left says the state.
   */
  const lines = [
    "Every trade pays 2% — all of it goes to the clans holding the map",
    `${SEATS_PER_CLAN} seats to a clan, one wallet one seat`,
    `Two seats hold one hex; a full clan holds ${holdCapacity(SEATS_PER_CLAN)} of ${HEX_COUNT}`,
    "Fees are split by seat, not by balance",
    "Buying more tokens earns you nothing — taking a seat does",
    "Every attack is voted in the open, twelve hours before it lands",
    "A tie holds for the defender",
    `All ${HEX_COUNT} hexes pay the same share — what differs is who is next to you`,
  ];

  return (
    <div className="flex items-stretch border-t border-rule bg-void">
      <span className="flex shrink-0 items-center gap-2 border-r border-rule px-4 py-2.5">
        <span className="h-2 w-2 bg-gold" />
        <span className="type-label text-gold">Awaiting launch</span>
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
        <span className="type-label text-chalk-muted">2% fee · 100% to clans</span>
      </span>
    </div>
  );
}
