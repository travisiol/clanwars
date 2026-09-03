"use client";

/*
 * The hex sheet, slid in over the board.
 *
 * Two states, and which one shows is a fact rather than a choice: a hex
 * somebody holds gets its clan, its garrison and what it costs to take, and
 * a hex nobody holds gets what claiming it would mean. A third block appears
 * only when there is a vote open on this exact hex — that is the whole
 * reason gold exists on this site.
 *
 * The two figures at the bottom of the garrison block are the entire
 * strategic content of a piece of ground: what it costs to take if nobody
 * answers, and what it costs if the owner musters what it usually musters.
 * They are only different because people show up.
 */

import { Roster, RosterKey } from "@/components/Roster";
import { WarBars } from "@/components/War";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/Button";
import { Label, Stat } from "@/components/ui/Label";
import { board, readHex } from "@/lib/board";
import { formatEth, formatTokens, SEAT_STAKE } from "@/lib/economics";
import { formatWindow, plural } from "@/lib/format";
import { hexes } from "@/lib/hex";
import { INKS } from "@/lib/inks";
import { DUG_IN_CAP, SEATS_PER_CLAN } from "@/lib/rules";
import { mapIsLive } from "@/lib/site-config";
import { useUi } from "@/lib/ui-state";

export function HexPanel({ hex, onClose }: { hex: number; onClose: () => void }) {
  const b = board();
  const { openInfo } = useUi();
  const reading = readHex(hex);
  const clan = reading.owner >= 0 ? b.clans.find((c) => c.id === reading.owner) : null;
  const war = b.wars.find((w) => w.hex === hex) ?? null;

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l border-rule bg-void/97 backdrop-blur-sm">
      {/* ---- header ---------------------------------------------------- */}
      <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="type-display text-chalk">
              Hex #{String(hex).padStart(3, "0")}
            </span>
            {war ? (
              <span className="type-label flex items-center gap-1.5 border border-gold bg-gold/10 px-2 py-1 text-gold">
                <span className="open-vote h-1.5 w-1.5 bg-gold" aria-hidden />
                Under attack
              </span>
            ) : clan ? (
              <span
                className="type-label border px-2 py-1"
                style={{ borderColor: INKS[clan.ink], color: INKS[clan.ink] }}
              >
                Held
              </span>
            ) : (
              <span className="type-label border border-rule px-2 py-1 text-chalk-muted">
                Grass
              </span>
            )}
          </div>
          <p className="type-data mt-2 text-chalk-soft">
            {clan ? clan.name : "Nobody has claimed this"}
          </p>
          <p className="type-data text-chalk-muted">
            Ring {hexes[hex].ring} · pays {formatEth(b.perHex, 4)} ETH a day, like every other hex
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close hex"
          className="type-data shrink-0 border border-rule px-2.5 py-1 text-chalk-muted transition-colors duration-150 hover:border-gold hover:text-gold"
        >
          ✕
        </button>
      </div>

      {/* ---- the vote, if there is one --------------------------------- */}
      {war && (
        <div className="border-b border-rule bg-gold/[0.05] px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-gold">Vote open — resolves when it closes</Label>
            <span className="type-data text-gold">{formatWindow(war.minutesLeft)}</span>
          </div>
          <div className="mt-4">
            <WarBars w={war} />
          </div>
        </div>
      )}

      {/* ---- the ground ------------------------------------------------ */}
      {clan ? (
        <>
          <div className="grid grid-cols-3 gap-4 border-b border-rule px-5 py-5">
            <Stat label="Held for" value={`${reading.held} ${plural(reading.held, "day")}`} />
            <Stat
              label="Dug in"
              value={`${reading.dugIn} / ${DUG_IN_CAP}`}
              hint="One point per day held, capped."
            />
            <Stat label="Pays" value={`${formatEth(b.perHex, 4)}`} hint="ETH per day" />
          </div>

          <div className="border-b border-rule px-5 py-5">
            <Label className="text-chalk">What it costs to take</Label>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stat
                label="If nobody answers"
                value={`${reading.costIfNobodyAnswers} seats`}
                tone="text-loss"
              />
              <Stat
                label="If the clan musters"
                value={`${reading.costIfAnswered} seats`}
                tone="text-gain"
              />
            </div>
            <p className="type-body mt-3 text-chalk-soft">
              The difference between those two numbers is the entire value of a group
              chat. Nothing else about this hex changes.
            </p>
          </div>

          {/* ---- the clan ------------------------------------------------ */}
          <div className="border-b border-rule px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-chalk">{clan.name}</Label>
              <span className="type-data text-chalk-muted">{clan.room}</span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <Stat label="Seats" value={`${clan.seats}/${SEATS_PER_CLAN}`} />
              <Stat label="Turnout" value={`${Math.round(clan.discipline * 100)}%`} />
              <Stat label="Per seat / day" value={formatEth(clan.perSeat, 4)} />
            </div>

            <div className="mt-5">
              <Roster
                ink={clan.ink}
                filled={clan.seats}
                cell={12}
                label={`${clan.name}: ${clan.seats} of ${SEATS_PER_CLAN} seats taken`}
              />
              <div className="mt-3">
                <RosterKey ink={clan.ink} />
              </div>
            </div>

            <p className="type-body mt-4 text-chalk-soft">
              {clan.hexes} {plural(clan.hexes, "hex", "hexes")} held of a{" "}
              {clan.capacity} ceiling — two seats hold one hex.{" "}
              {clan.atCapacity
                ? "It cannot take more ground without recruiting."
                : `It has room for ${clan.capacity - clan.hexes} more.`}
            </p>
          </div>

          {/* ---- neighbours ---------------------------------------------- */}
          <div className="border-b border-rule px-5 py-5">
            <Label className="text-chalk">Next to</Label>
            {reading.threats.length === 0 ? (
              <p className="type-body mt-3 text-chalk-soft">
                Nobody. Quiet ground — which on this board means it earns exactly as much
                as the ground being fought over.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {reading.threats.map((t) => {
                  const c = b.clans.find((x) => x.id === t);
                  if (!c) return null;
                  return (
                    <li key={t} className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 shrink-0"
                        style={{ background: INKS[c.ink] }}
                        aria-hidden
                      />
                      <span className="type-data text-chalk">{c.name}</span>
                      <span className="type-data ml-auto text-chalk-muted">
                        {c.seats} seats · {Math.round(c.discipline * 100)}% turnout
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="border-b border-rule px-5 py-5">
          <Label className="text-chalk">Unclaimed</Label>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat label="Claim costs" value="1 seat" hint="For one epoch." />
            <Stat label="Its share" value={formatEth(b.perHex, 4)} hint="ETH per day" />
          </div>
          <p className="type-body mt-3 text-chalk-soft">
            Nobody is paid for this hex, and its share is not burned either — it rolls
            into the next epoch and stays there until somebody claims the ground. There
            {b.neutralHexes === 1 ? " is" : " are"} {b.neutralHexes} like it, carrying{" "}
            {formatEth(b.carried, 4)} ETH forward.
          </p>
        </div>
      )}

      {/* ---- the act ---------------------------------------------------- */}
      <div className="mt-auto border-t border-rule px-5 py-5">
        <div className="flex flex-wrap gap-3">
          <Button disabled={!mapIsLive} title={mapIsLive ? undefined : "Awaiting launch"}>
            {clan ? `Take a seat in ${clan.tag}` : "Claim this hex"}
          </Button>
          <WalletConnect className="border border-rule-strong px-4 py-3 text-chalk hover:border-gold hover:text-gold" />
        </div>
        <p className="type-data mt-3 text-chalk-muted">
          {mapIsLive
            ? `A seat locks ${formatTokens(SEAT_STAKE)} tokens and pays the same as every other seat in the clan.`
            : `Awaiting launch. A seat locks ${formatTokens(SEAT_STAKE)} tokens and is paid the same as every other seat in its clan, whatever anyone’s balance.`}
        </p>
        <button
          type="button"
          onClick={() => openInfo("seat")}
          className="type-label mt-3 text-chalk-soft transition-colors duration-150 hover:text-gold"
        >
          Why buying more earns nothing →
        </button>
      </div>
    </div>
  );
}
