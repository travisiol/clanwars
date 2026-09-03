"use client";

import { Drawer } from "@/components/Drawer";
import { WalletConnect } from "@/components/WalletConnect";
import { Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import { formatWindow } from "@/lib/format";
import { HEX_COUNT } from "@/lib/hex";
import { SEATS_PER_CLAN } from "@/lib/rules";
import { siteConfig } from "@/lib/site-config";
import { useUi } from "@/lib/ui-state";

/*
 * The state of the board, carried in the header.
 *
 * Every chip is a real reading off the played season. The one that moves is
 * the vote clock: this site has no scroll, so the countdown in the corner is
 * the only thing that has to follow a visitor around — and it is the only
 * number on the site with a deadline attached to it.
 */

/** The mark: a hex with one edge drawn heavy — the side somebody is on. */
function Mark() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden focusable="false">
      <path
        d="M15 1.5 L28 9 V25 L15 32.5 L2 25 V9 Z"
        fill="none"
        stroke="#f2a71b"
        strokeWidth="2"
      />
      <path d="M28 9 V25 L15 32.5" fill="none" stroke="#ffffff" strokeWidth="3.6" />
    </svg>
  );
}

export function Navbar() {
  const b = board();
  const { openInfo, pick } = useUi();
  const soonest = b.wars.reduce<number | null>(
    (best, w) => (best === null ? w.minutesLeft : Math.min(best, w.minutesLeft)),
    null,
  );

  const chips = [
    { key: "Hexes", value: String(HEX_COUNT) },
    { key: "Held", value: String(b.ownedHexes) },
    { key: "Clans", value: String(b.clans.length) },
    { key: "Seats", value: `${b.totalSeats} / ${b.clans.length * SEATS_PER_CLAN}` },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-void/92 backdrop-blur-sm">
      <nav className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Drawer />

        <button
          type="button"
          onClick={() => pick(null)}
          className="flex shrink-0 items-center gap-3 text-left"
        >
          <Mark />
          <span className="hidden sm:block">
            <span className="type-title block leading-none text-chalk">{siteConfig.name}</span>
            <span className="type-label mt-1 block text-gold">Sit. Hold. Split.</span>
          </span>
        </button>

        <ul className="hidden items-center gap-5 xl:flex">
          {chips.map((chip) => (
            <li key={chip.key} className="flex items-baseline gap-2">
              <Label>{chip.key}</Label>
              <span className="type-data text-chalk">{chip.value}</span>
            </li>
          ))}
          <li className="flex items-baseline gap-2">
            <Label>Token</Label>
            <span className="type-data text-gold">{siteConfig.ticker}</span>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-3">
          {soonest !== null && (
            <button
              type="button"
              onClick={() => openInfo("how")}
              title="A war vote is open. It resolves when the window closes."
              className="hidden items-center gap-2 border border-gold/40 bg-gold/10 px-2.5 py-1.5 transition-colors duration-150 hover:border-gold sm:flex"
            >
              <span className="open-vote h-1.5 w-1.5 bg-gold" aria-hidden />
              <span className="type-label text-gold">Vote closes</span>
              <span className="type-data text-gold">{formatWindow(soonest)}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => openInfo("how")}
            className="type-label hidden text-chalk-soft transition-colors duration-150 hover:text-gold md:inline"
          >
            How it works
          </button>
          <WalletConnect showHint={false} />
        </div>
      </nav>
    </header>
  );
}
