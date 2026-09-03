"use client";

/**
 * The board, and the panel that reads it.
 *
 * Two readings, one plate, and the toggle between them is the most useful
 * control on the site: HOLD answers "who owns what", FRONT answers "where is
 * this actually being decided", and those are different maps of the same
 * ground. A single view would have to compromise one of them, and the second
 * question is the one this game is about.
 *
 * The panel never invents anything. Every line in it is derived in
 * `board.ts` from the same season the map is drawn from, including the two
 * costs — what an attacker needs if nobody answers, and what it needs if the
 * owner musters what it usually musters. Those two numbers are the entire
 * strategic content of a hex, and they are only different because people
 * show up.
 */

import { useState } from "react";
import { clsx } from "clsx";
import { MapPlate, type MapMode } from "@/components/MapPlate";
import { Label } from "@/components/ui/Label";
import { board, readHex } from "@/lib/board";
import { formatEth } from "@/lib/economics";
import { HEX_COUNT } from "@/lib/hex";
import { DUG_IN_CAP } from "@/lib/rules";
import { INKS } from "@/lib/inks";

function Swatch({ ink }: { ink: number }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0"
      style={{ background: INKS[ink % INKS.length], borderRadius: 1 }}
      aria-hidden
    />
  );
}

function Row({ k, v, hint }: { k: string; v: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="type-label text-ink-mute">{k}</span>
      <span className="type-data text-right text-ink" title={hint}>
        {v}
      </span>
    </div>
  );
}

export function MapStage() {
  const b = board();
  const [mode, setMode] = useState<MapMode>("hold");
  const [active, setActive] = useState<number | null>(null);

  const reading = active === null ? null : readHex(active);
  const owner = reading && reading.owner >= 0 ? b.clans.find((c) => c.id === reading.owner) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Label>
            {mode === "hold"
              ? "Who holds what"
              : "Where two clans touch — every heavy line is a decision waiting to happen"}
          </Label>
          <div className="flex items-center gap-1 rounded-full border border-rule bg-paper-lit p-1">
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
                className={clsx(
                  "type-label rounded-full px-3 py-1.5 transition-colors",
                  mode === value ? "bg-ink text-paper-lit" : "text-ink-mute hover:text-ink",
                )}
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* The fold marks are a SIBLING behind the canvas, never its parent:
            `.fold-grid` carries a mask, and a mask on a parent applies to its
            children, which quietly washed the whole map out to a pastel. */}
        <div className="relative">
          <div className="fold-grid pointer-events-none absolute inset-0" aria-hidden />
          <MapPlate
            board={b}
            mode={mode}
            active={active}
            onActive={setActive}
            className="relative mx-auto aspect-[26/29] w-full max-w-[560px]"
          />
        </div>

        <p className="type-data mt-3 text-ink-mute">
          Simulated board, epoch {b.epoch} of a season played by the rules on this page.
          Nothing is deployed; this is what the rules do, not what anyone did.
        </p>
      </div>

      <aside className="lg:pt-9">
        <div className="sheet px-4 py-3">
          {reading === null ? (
            <>
              <div className="pb-1">
                <Label>The board</Label>
              </div>
              <div className="divide-y divide-rule">
                <Row k="Hexes" v={`${HEX_COUNT}`} />
                <Row k="Held" v={`${b.ownedHexes}`} />
                <Row k="Grass" v={`${b.neutralHexes}`} hint="Unowned. Its share rolls forward." />
                <Row k="Clans" v={`${b.clans.length}`} />
                <Row k="Seats taken" v={`${b.totalSeats} / ${b.clans.length * 50}`} />
                <Row k="Each hex pays" v={`${formatEth(b.perHex, 4)} ETH / day`} />
                <Row
                  k="Rolled forward"
                  v={`${formatEth(b.carried, 4)} ETH`}
                  hint="Shares belonging to hexes nobody owns. Never expires."
                />
              </div>
              <p className="type-data mt-3 border-t border-rule pt-3 text-ink-mute">
                Point at a hex — or focus the map and use the arrow keys.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <Label>Hex {String(reading.id).padStart(3, "0")}</Label>
                {owner ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Swatch ink={owner.ink} />
                    <span className="type-data text-ink">{owner.name}</span>
                  </span>
                ) : (
                  <span className="type-data text-ink-mute">Grass</span>
                )}
              </div>
              <div className="divide-y divide-rule">
                {owner ? (
                  <>
                    <Row k="Held for" v={`${reading.held} ${reading.held === 1 ? "day" : "days"}`} />
                    <Row
                      k="Dug in"
                      v={`${reading.dugIn} / ${DUG_IN_CAP}`}
                      hint="One point per day held, capped."
                    />
                    <Row k="Pays" v={`${formatEth(b.perHex, 4)} ETH / day`} />
                    <Row
                      k="Owner's seats"
                      v={`${owner.seats} / 50`}
                      hint="Every one of them can answer a muster."
                    />
                    <Row
                      k="Take it, unanswered"
                      v={`${reading.costIfNobodyAnswers} seats`}
                      hint="If nobody in the owning clan shows up."
                    />
                    <Row
                      k="Take it, answered"
                      v={`${reading.costIfAnswered} seats`}
                      hint="If the clan musters what it usually musters."
                    />
                  </>
                ) : (
                  <>
                    <Row k="Owner" v="Nobody" />
                    <Row k="Claim costs" v="1 seat" />
                    <Row
                      k="Its share"
                      v={`${formatEth(b.perHex, 4)} ETH / day`}
                      hint="Rolling forward until somebody claims it."
                    />
                  </>
                )}
              </div>
              <div className="mt-3 border-t border-rule pt-3">
                <Label>Next to</Label>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
                  {reading.threats.length === 0 ? (
                    <span className="type-data text-ink-mute">Nobody. Quiet ground.</span>
                  ) : (
                    reading.threats.map((t) => {
                      const c = b.clans.find((x) => x.id === t);
                      if (!c) return null;
                      return (
                        <span key={t} className="inline-flex items-center gap-1.5">
                          <Swatch ink={c.ink} />
                          <span className="type-data text-ink">{c.tag}</span>
                          <span className="type-data text-ink-mute">{c.seats}</span>
                        </span>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {b.clans.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5">
              <Swatch ink={c.ink} />
              <span className="type-data text-ink">{c.tag}</span>
              <span className="type-data ml-auto text-ink-mute">{c.hexes}</span>
            </span>
          ))}
          <span className="col-span-2 mt-1 inline-flex items-center gap-1.5 border-t border-rule pt-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 border border-rule-strong"
              style={{ borderRadius: 1 }}
              aria-hidden
            />
            <span className="type-data text-ink-mute">Grass</span>
            <span className="type-data ml-auto text-ink-mute">{b.neutralHexes}</span>
          </span>
        </div>
      </aside>
    </div>
  );
}
