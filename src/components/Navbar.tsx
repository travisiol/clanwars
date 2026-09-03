"use client";

import { Drawer } from "@/components/Drawer";
import { WalletConnect } from "@/components/WalletConnect";
import { Awaiting, Label } from "@/components/ui/Label";
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
  const { openInfo, pick } = useUi();
  /*
   * The rules, not a scoreboard. "215 held / 491 seats" read as a report on a
   * game that is running, which is not the state — and the four numbers that
   * never change are more use to somebody meeting this for the first time.
   */
  const chips = [
    { key: "Hexes", value: String(HEX_COUNT) },
    { key: "Seats a clan", value: String(SEATS_PER_CLAN) },
    { key: "Fee", value: "2% / 2%" },
    { key: "To clans", value: "100%" },
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
          {/* This used to be a ticking vote countdown, which was the loudest
              claim on the page that something was already running. The state
              is what belongs in the corner until it isn't. */}
          <button
            type="button"
            onClick={() => openInfo("how")}
            title="Nothing has launched yet. Read how it works."
            className="hidden transition-colors duration-150 hover:opacity-80 sm:block"
          >
            <Awaiting />
          </button>
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
