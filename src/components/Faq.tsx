/**
 * The constants, then the questions.
 *
 * The table above the questions is every number that is fixed by the rules
 * rather than produced by play, pulled from `rules.ts` and `economics.ts` so
 * it cannot disagree with the game. If a reader only reads one block on this
 * site it should be that one, because it is the whole contract.
 *
 * The questions include the ones with bad answers. A FAQ that only asks the
 * questions with good answers is an advertisement, and the two open ones at
 * the end — what funds this, and what a regulator would call it — are
 * genuinely unanswered rather than coyly deferred.
 */

import { Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import {
  CLAN_BPS,
  FEE_BPS_BUY,
  FEE_BPS_SELL,
  SEAT_STAKE,
  SUPPLY,
  clanCeilingBps,
  formatBps,
  formatEth,
  formatTokens,
} from "@/lib/economics";
import { HEX_COUNT } from "@/lib/hex";
import {
  DUG_IN_CAP,
  EPOCH_HOURS,
  MUSTER_HOURS,
  SEATS_PER_CLAN,
  SEATS_PER_HEX,
  holdCapacity,
} from "@/lib/rules";

const QUESTIONS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What am I buying?",
    a: (
      <>
        A seat. You lock {formatTokens(SEAT_STAKE)} tokens — {formatBps(5)} of supply
        — and take one of a clan&apos;s fifty places. One wallet holds one seat.
        Unlock and the seat frees for someone else.
      </>
    ),
  },
  {
    q: "Does holding more tokens earn more?",
    a: (
      <>
        No. Not slightly less than proportionally — nothing at all. Fees reach a
        wallet through the seat it occupies, and every seat in a clan is paid the
        same. The second stake in the same wallet is inert.
      </>
    ),
  },
  {
    q: "So why hold more than one stake?",
    a: (
      <>
        To sit in a second clan, with a second wallet. That is the only use, and
        it is deliberately the expensive one: fifty seats mean fifty wallets that
        each have to vote and answer musters on their own.
      </>
    ),
  },
  {
    q: "Why fifty?",
    a: (
      <>
        Because it is a ceiling and a chat at the same time. Fifty seats hold{" "}
        {holdCapacity(SEATS_PER_CLAN)} of {HEX_COUNT} hexes — {formatBps(clanCeilingBps())} of
        the fees — so no clan can run away with the board; and fifty is still few
        enough that people know each other, which is the only reason anyone
        answers at three in the morning.
      </>
    ),
  },
  {
    q: "Can a whale just buy a clan?",
    a: (
      <>
        Yes, and pretending otherwise would be the easiest lie on this page. Fifty
        wallets, {formatBps(Number((SEAT_STAKE * BigInt(SEATS_PER_CLAN) * 10_000n) / SUPPLY))}{" "}
        of supply, and every one of those wallets has to keep turning up. What the
        cap buys is not immunity; it is that money alone does not settle a hex.
      </>
    ),
  },
  {
    q: "How many clans are there?",
    a: (
      <>
        As many as people raise. Nothing in the rules caps the number of
        banners — what is capped is what each one can hold, so the board only
        sustains about eight full clans. Founding a thirteenth is a bet that you
        can take ground off somebody who already has it.
      </>
    ),
  },
  {
    q: "Who lets me into a clan?",
    a: (
      <>
        Nobody — an empty seat is taken by whoever stakes for it first. A clan can
        vote a seat out by a majority of its filled seats, and the stake goes back
        whole. Not slashed: if eviction paid, fifty people would have a standing
        reason to rob the fifty-first.
      </>
    ),
  },
  {
    q: "What happens if we lose a war?",
    a: (
      <>
        You lose the hex and the income it was earning. Not your stake, not your
        seat, not the treasury the clan has already been paid. You can lose ground
        here; you cannot lose your bag. A game where defeat empties the wallet is
        a game everybody quits once.
      </>
    ),
  },
  {
    q: "Why is an attack announced twelve hours early?",
    a: (
      <>
        Because the alternative rewards insomnia. A surprise attack is settled by
        who happened to be awake; an announced one is settled by who can get their
        clan out of bed, which is the game this is trying to be.
      </>
    ),
  },
  {
    q: "Why does a tie hold for the defender?",
    a: (
      <>
        Strictly greater, with no margin on either side. If a draw took the hex,
        the cheapest attack would be to match the garrison exactly and let the
        clock finish it. And a margin in the defender&apos;s favour, past a point,
        makes old ground unkillable — which is why the dig-in stops at{" "}
        {DUG_IN_CAP}.
      </>
    ),
  },
  {
    q: "Why does every hex pay the same?",
    a: (
      <>
        Because the moment some ground pays more, the game is about buying the
        good ground, and the good ground goes to whoever has the most money. All{" "}
        {HEX_COUNT} pay one equal share. What differs between two hexes is who is
        standing on the other side of them.
      </>
    ),
  },
  {
    q: "What happens to a hex nobody owns?",
    a: (
      <>
        Its share is not paid and not burned — it rolls into the next epoch and
        stays there until somebody claims the ground. An empty board makes the
        next day worth more.
      </>
    ),
  },
  {
    q: "What does the protocol take?",
    a: (
      <>
        Nothing. {formatBps(CLAN_BPS)} of the fee reaches the clans. That number is
        in the headline, so it has to be literally true — and the honest
        consequence is the next answer.
      </>
    ),
  },
  {
    q: "Then what pays for building this?",
    a: (
      <>
        Not decided. There is no revenue line anywhere in these rules, which is
        the price of the sentence above. Any answer — a treasury allocation, a
        share of the fee, a separate raise — changes a number on this page, and
        it will be changed here before it is changed anywhere else.
      </>
    ),
  },
  {
    q: "Is a seat a security?",
    a: (
      <>
        Unanswered, and not by us. A locked stake that pays a share of trading
        fees is exactly the shape lawyers argue about. It has not been through
        counsel in any jurisdiction, and until it has, that sentence is the whole
        of what is known.
      </>
    ),
  },
];

export function Faq() {
  const b = board();

  const rows: [string, string][] = [
    ["Supply", `${formatTokens(SUPPLY)} tokens, fixed, no mint`],
    ["Trading fee", `${formatBps(FEE_BPS_BUY)} buy · ${formatBps(FEE_BPS_SELL)} sell`],
    ["To clans", `${formatBps(CLAN_BPS)} — nothing is skimmed`],
    ["Stake per seat", `${formatTokens(SEAT_STAKE)} (${formatBps(5)} of supply)`],
    ["Seats per clan", `${SEATS_PER_CLAN}`],
    ["Seats per hex", `${SEATS_PER_HEX} — a full clan holds ${holdCapacity(SEATS_PER_CLAN)}`],
    ["Board", `${HEX_COUNT} hexes, all paying the same share`],
    ["Ceiling for one clan", formatBps(clanCeilingBps())],
    ["Epoch", `${EPOCH_HOURS} hours — seats refresh, fees settle`],
    ["War vote", `${MUSTER_HOURS} hours, open to both sides`],
    ["Dig-in", `1 per epoch held, capped at ${DUG_IN_CAP}`],
    ["Tie", "holds for the defender"],
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-16">
      <div className="lg:sticky lg:top-0 lg:self-start">
        <Label>Everything that is fixed</Label>
        <dl className="mt-4 divide-y divide-rule border-y border-rule">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="type-label text-chalk-muted">{k}</dt>
              <dd className="type-data max-w-[58%] text-right text-chalk">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="type-data mt-3 text-chalk-muted">
          At 380 ETH of trading a day, one hex pays {formatEth(b.perHex, 4)} ETH a day
          and a seat in a clan at capacity takes {formatEth(b.perHex / 2n, 4)} ETH.
        </p>
      </div>

      <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {QUESTIONS.map((item) => (
          <div key={item.q}>
            <dt className="type-title text-chalk">{item.q}</dt>
            <dd className="type-body mt-2 text-chalk-soft">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
