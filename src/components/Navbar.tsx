"use client";

/*
 * A rail, not a bar. It floats a few pixels off the top on a sheet with a
 * hairline edge, so it reads as another piece of paper on the table rather
 * than a chrome band bolted across the page.
 *
 * The one figure it carries is how long the open vote has left, because that
 * is the only number on this site with a deadline attached to it. Scroll past
 * the map and the countdown stays in the corner of the eye — which is exactly
 * what it does in the group chat this game is really played in.
 */

import { clsx } from "clsx";
import { Mark } from "@/components/Mark";
import { WalletConnect } from "@/components/WalletConnect";
import { board } from "@/lib/board";
import { formatWindow } from "@/lib/format";
import { nav, siteConfig } from "@/lib/site-config";

export function Navbar() {
  const b = board();
  const soonest = b.wars.reduce<number | null>(
    (best, w) => (best === null ? w.minutesLeft : Math.min(best, w.minutesLeft)),
    null,
  );

  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <div
        className={clsx(
          "mx-auto flex h-14 max-w-[1180px] items-center gap-4 rounded-full px-4 sm:px-5",
          "border border-rule bg-[color-mix(in_srgb,var(--paper-lit)_84%,transparent)] backdrop-blur-md",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_10px_30px_-24px_rgba(26,29,36,0.6)]",
        )}
      >
        <a href="#top" className="flex shrink-0 items-center gap-2.5 text-ink">
          <Mark />
          <span className="type-label text-ink">{siteConfig.name}</span>
        </a>

        <nav className="ml-2 hidden items-center gap-5 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="type-label text-ink-mute transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {soonest !== null && (
            <span
              className="hidden items-center gap-2 sm:flex"
              title="Time left in the soonest war vote"
            >
              <span className="open-vote h-1.5 w-1.5 rounded-full bg-war" aria-hidden />
              <span className="type-label text-ink-mute">Vote closes</span>
              <span className="type-data tnum text-war">{formatWindow(soonest)}</span>
            </span>
          )}
          <WalletConnect showHint={false} className="shrink-0" />
        </div>
      </div>
    </header>
  );
}
