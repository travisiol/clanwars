"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { HexMap, type MapMode } from "@/components/HexMap";
import { HexPanel } from "@/components/HexPanel";
import { InfoOverlay } from "@/components/InfoOverlay";
import { Ticker } from "@/components/Ticker";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/Button";
import { Awaiting, Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import { SEAT_STAKE, WAD, formatEth, formatTokens } from "@/lib/economics";
import { HEX_COUNT } from "@/lib/hex";
import { SEATS_PER_CLAN, SEATS_PER_HEX } from "@/lib/rules";
import { siteConfig } from "@/lib/site-config";
import { useUi } from "@/lib/ui-state";

/*
 * One page: the board, and whatever is being looked at on it.
 *
 * On a wide screen there is nothing to scroll to. The pitch sits beside the
 * map until a hex is picked, at which point it steps aside for that hex's
 * sheet, and the explanation opens over the top when asked for. A visitor
 * only ever has one thing in front of them, and the thing they arrive at is
 * a map with a gold halo on it — which is a question ("what is happening
 * there?") rather than a paragraph.
 *
 * On a phone that arrangement stops working, and the honest fix is to stop
 * pretending: the map takes the top of the screen, the pitch sits under it,
 * and the page scrolls like a page. Cramming both into one portrait screen
 * means either a map too small to read or copy printed on top of it, and
 * copy on top of the map is the one thing this layout exists to avoid.
 */
export function Board() {
  const b = board();
  const { picked, pick, infoTab, openInfo, closeInfo } = useUi();
  const [mode, setMode] = useState<MapMode>("hold");
  const [hover, setHover] = useState<number | null>(null);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") pick(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pick]);

  /*
   * The board moves out from under whatever is open: beside the copy on a
   * wide screen, further left again when a hex sheet takes the right edge.
   * On a phone it is centred in its own block and nothing is read over it.
   */
  const bias = wide ? (picked !== null ? 0.34 : 0.66) : 0.5;
  const biasY = wide ? 0.48 : 0.5;

  /*
   * With 217 hexes on screen, hunting for the interesting one by hand is not
   * a game anyone wins. This goes to a hex with a vote open on it when there
   * is one — both the most interesting hex on the board and the fastest way
   * to show that the map is clickable.
   */
  const openAHex = () => {
    if (b.wars.length > 0) {
      pick(b.wars[0].hex);
      return;
    }
    const held: number[] = [];
    for (let i = 0; i < HEX_COUNT; i++) if (b.owner[i] !== -1) held.push(i);
    pick(held[Math.floor(Math.random() * held.length)] ?? 108);
  };

  /*
   * What a seat is paid, on the front page and not three clicks in.
   *
   * A clan at capacity holds half its seats in hexes, so one seat's daily
   * take is simply the per-hex share halved. It is the number a visitor is
   * actually here for and it should not need an overlay to find.
   */
  const perSeatDaily = b.perHex / 2n;

  /*
   * Three lines, in the order a person does them, and one line each. They are
   * rows rather than cards because the pitch has to survive a short laptop
   * screen with the buttons still above the ticker — three stacked cards cost
   * forty pixels the layout does not have.
   */
  const steps = [
    {
      head: "Take a seat",
      body: `Lock ${formatTokens(SEAT_STAKE)} tokens. One wallet, one seat.`,
    },
    {
      head: "Hold ground",
      body: `${SEATS_PER_HEX} seats hold one hex. Vote to take more.`,
    },
    {
      head: "Get paid",
      body: "The 2% fee is split between the seats, daily.",
    },
  ];

  return (
    /*
     * On lg the root is absolutely positioned rather than h-full: main is a
     * flex-1 item, so its computed height stays `auto` and a percentage
     * height resolves to zero against it. Filling the positioned ancestor
     * sidesteps that.
     */
    <div className="relative flex min-h-full flex-col lg:absolute lg:inset-0 lg:block lg:overflow-hidden">
      <div className="relative h-[52vh] w-full shrink-0 lg:absolute lg:inset-0 lg:h-auto">
        <HexMap
          board={b}
          mode={mode}
          active={hover}
          onActive={setHover}
          onPick={pick}
          bias={bias}
          biasY={biasY}
          className="h-full w-full"
        />

        {/* Two readings of the same board, and the second one is the point. */}
        <div className="absolute top-3 right-3 z-20 flex items-center border border-rule bg-void/80 backdrop-blur-sm sm:top-4 sm:right-4">
          {(
            [
              ["hold", "Holdings"],
              ["front", "Fronts"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              title={
                value === "hold"
                  ? "Who holds what"
                  : "Where two clans touch — every bright line is a decision waiting to happen"
              }
              className={clsx(
                "type-label px-3 py-2 transition-colors duration-150",
                mode === value ? "bg-gold text-void" : "text-chalk-soft hover:text-gold",
              )}
            >
              {text}
            </button>
          ))}
        </div>

        {/* What the pointer is over, so the map answers before it is clicked. */}
        {hover !== null && picked === null && (
          <div className="pointer-events-none absolute top-14 right-3 z-20 border border-rule bg-void/85 px-3 py-2 backdrop-blur-sm sm:top-16 sm:right-4">
            <span className="type-data text-chalk">
              Hex {String(hover).padStart(3, "0")}
              <span className="text-chalk-muted">
                {" · "}
                {b.owner[hover] === -1
                  ? "grass"
                  : (b.clans.find((c) => c.id === b.owner[hover])?.name ?? "")}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* The pitch, until a hex takes its place.

          The scrim on it is not decoration: on a wide screen the copy sits
          over a map that is bright all the way to its left rim, and text on
          top of a hex grid is unreadable at any weight. It fades out well
          before the board's centre so the map still reads as one object. */}
      {picked === null && (
        <div className="relative z-10 w-full px-4 pt-8 pb-16 sm:px-8 lg:pointer-events-none lg:absolute lg:inset-y-0 lg:right-auto lg:flex lg:w-[52%] lg:items-center lg:overflow-y-auto lg:bg-gradient-to-r lg:from-void lg:from-45% lg:to-transparent lg:py-6 lg:pr-16">
          <div className="pitch w-full max-w-[520px] lg:pointer-events-auto">
            <div className="flex flex-wrap items-center gap-3">
              <Awaiting />
              <Label>Robinhood Chain</Label>
            </div>

            <h1 className="type-hero wordmark-outline mt-4 text-chalk">{siteConfig.wordmark}</h1>
            <p className="type-display mt-3 text-gold">Join a clan</p>
            <p className="type-display text-chalk">and earn</p>

            <p className="type-body mt-5 max-w-[46ch] text-chalk-soft">
              {SEATS_PER_CLAN} people to a clan. Your clan holds hexes on the map, every
              trade pays a 2% fee, and all of it goes to the clans holding ground — one
              equal share per seat.
            </p>

            {/* The three things a person does, in the order they do them.
                This used to live behind a button; it is the point of the page. */}
            <ol className="mt-6 divide-y divide-rule border-y border-rule">
              {steps.map((step, i) => (
                <li key={step.head} className="flex flex-wrap items-baseline gap-x-3 py-2">
                  <span className="type-label w-5 shrink-0 text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="type-data w-[92px] shrink-0 text-chalk">{step.head}</span>
                  <span className="type-data min-w-0 flex-1 text-chalk-muted">{step.body}</span>
                </li>
              ))}
            </ol>

            <p className="type-data mt-4">
              <span className="text-gold">
                {formatEth(perSeatDaily, 4)} ETH a day per seat
              </span>
              <span className="text-chalk-soft">
                {" "}
                at {(b.volume / WAD).toLocaleString("en-US")} ETH of trading a day.
              </span>
            </p>

            <div className="mt-6 flex flex-wrap items-start gap-3">
              <WalletConnect variant="solid" wrapperClassName="max-w-[280px]" />
              <Button variant="outline" onClick={openAHex}>
                {"See a war"}
              </Button>
              <Button variant="outline" onClick={() => openInfo("how")}>
                How to play
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Once a hex is picked, the pitch collapses to one line. */}
      {picked !== null && (
        <div className="relative z-10 hidden px-4 pt-6 pb-16 sm:block sm:px-8 lg:pointer-events-none lg:absolute lg:inset-x-0 lg:bottom-12 lg:pt-0">
          <div className="flex flex-wrap items-center gap-3 lg:pointer-events-auto">
            <Awaiting />
            <Button variant="outline" onClick={() => openInfo("how")}>
              How to play
            </Button>
          </div>
        </div>
      )}

      {/* The hex sheet: the whole screen on a phone, a rail beside the map on
          a wide one. */}
      {picked !== null && (
        <div className="fixed inset-0 z-30 lg:absolute lg:inset-y-0 lg:right-0 lg:left-auto lg:w-full lg:max-w-[440px]">
          <HexPanel hex={picked} onClose={() => pick(null)} />
        </div>
      )}

      <div className="sticky bottom-0 z-20 mt-auto lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0">
        <Ticker />
      </div>

      {infoTab && <InfoOverlay initialTab={infoTab} onClose={closeInfo} />}
    </div>
  );
}
