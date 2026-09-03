/**
 * The piece the whole site is built around.
 *
 * Every token game has to answer the same question — what does buying more
 * get you — and almost all of them answer "proportionally more of everything",
 * which is why almost all of them end up owned by one wallet. This one answers
 * "nothing", and that is a strong enough claim that it has to be drawn rather
 * than asserted.
 *
 * So: one wallet on the x-axis, its daily fee income on the y. Under a
 * token-weighted split the line climbs for ever. Under this one it is a step
 * that goes flat the instant the wallet can afford a seat, because a wallet
 * occupies one seat and a seat is paid like every other seat. The two lines
 * cross at a computable balance, and past that point every token bought is
 * dead weight. That crossing is not decoration — it is derived here from the
 * same pot and the same stake the rest of the page uses, so it moves if the
 * economics move, and it cannot drift into flattering the argument.
 *
 * The honest half of the argument is printed underneath and not hidden: this
 * does not stop a whale. It converts a whale into fifty wallets that each have
 * to show up. That is the trade, stated plainly.
 */

import { Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import {
  SEAT_STAKE,
  SUPPLY,
  WAD,
  clanCeilingBps,
  formatBps,
  formatEth,
  formatTokens,
  seatIncome,
  tokenWeightedIncome,
} from "@/lib/economics";
import { HEX_COUNT } from "@/lib/hex";
import { SEATS_PER_CLAN, SEATS_PER_HEX, holdCapacity } from "@/lib/rules";

const eth = (wei: bigint) => Number(wei) / Number(WAD);

export function Seat() {
  const b = board();

  /* A clan at capacity: 50 seats, 25 hexes. The ordinary case, not the best. */
  const fullCapacity = holdCapacity(SEATS_PER_CLAN);
  const clanIncome = b.perHex * BigInt(fullCapacity);
  const perSeat = seatIncome(clanIncome, SEATS_PER_CLAN);

  /* Where the two rules cross, in stakes. */
  const perSeatEth = eth(perSeat);
  const perStakeEth = eth(tokenWeightedIncome(b.pot, SEAT_STAKE));
  const crossing = perStakeEth > 0 ? perSeatEth / perStakeEth : 0;
  /** One stake as a share of supply, in basis points. */
  const stakeBps = Number((SEAT_STAKE * 10_000n) / SUPPLY);

  /* Plot frame. */
  const W = 640;
  const H = 300;
  const pad = { l: 56, r: 22, t: 22, b: 44 };
  const xMax = Math.max(8, Math.ceil(crossing * 1.7));
  const yMax = Math.max(perSeatEth, perStakeEth * xMax) * 1.12;
  const px = (stakes: number) => pad.l + (stakes / xMax) * (W - pad.l - pad.r);
  const py = (value: number) => H - pad.b - (value / yMax) * (H - pad.t - pad.b);

  const ticks = Array.from({ length: 5 }, (_, i) => (yMax / 4) * i);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12">
      <div>
        <figure className="sheet p-4 sm:p-5">
          <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <Label>One wallet, one day, both rules</Label>
            <span className="type-data text-ink-mute">
              at {formatEth(b.pot, 2)} ETH of fees a day
            </span>
          </figcaption>

          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
            aria-label={`Daily fee income against tokens held in one wallet. Under a token-weighted split income rises without limit. Under this split it is flat at ${formatEth(perSeat, 4)} ETH from one stake onward, and the two are equal at ${crossing.toFixed(1)} stakes.`}
          >
            {ticks.map((t, i) => (
              <g key={i}>
                <line
                  x1={pad.l}
                  x2={W - pad.r}
                  y1={py(t)}
                  y2={py(t)}
                  stroke="var(--rule)"
                  strokeWidth="1"
                />
                <text
                  x={pad.l - 8}
                  y={py(t) + 3.5}
                  textAnchor="end"
                  className="type-data"
                  fill="var(--ink-mute)"
                  fontSize="10"
                >
                  {t.toFixed(3)}
                </text>
              </g>
            ))}

            {/* Dead money: everything bought past the crossing. Hatched in ink,
                never in vermilion — vermilion is war and this is only waste. */}
            <defs>
              <pattern id="dead" width="6" height="6" patternTransform="rotate(135)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--rule-strong)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect
              x={px(crossing)}
              y={pad.t}
              width={Math.max(0, W - pad.r - px(crossing))}
              height={H - pad.t - pad.b}
              fill="url(#dead)"
              opacity="0.5"
            />

            {/* Token-weighted: a straight line with no ceiling. */}
            <line
              x1={px(0)}
              y1={py(0)}
              x2={px(xMax)}
              y2={py(perStakeEth * xMax)}
              stroke="var(--ink-mute)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
            />

            {/* This rule: nothing, then a seat's pay, for ever. */}
            <path
              d={`M ${px(0)} ${py(0)} L ${px(1)} ${py(0)} L ${px(1)} ${py(perSeatEth)} L ${px(xMax)} ${py(perSeatEth)}`}
              fill="none"
              stroke="var(--ink)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* The crossing. */}
            <line
              x1={px(crossing)}
              y1={pad.t}
              x2={px(crossing)}
              y2={H - pad.b}
              stroke="var(--ink)"
              strokeWidth="1"
            />
            <circle cx={px(crossing)} cy={py(perSeatEth)} r="3.5" fill="var(--ink)" />

            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={py(0)}
              y2={py(0)}
              stroke="var(--rule-strong)"
              strokeWidth="1"
            />

            {[1, crossing].map((s, i) => (
              <text
                key={i}
                x={px(s)}
                y={H - pad.b + 16}
                textAnchor="middle"
                className="type-data"
                fill="var(--ink-mute)"
                fontSize="10"
              >
                {i === 0 ? "1 stake" : `${crossing.toFixed(1)} stakes`}
              </text>
            ))}
            <text
              x={W - pad.r}
              y={H - pad.b + 32}
              textAnchor="end"
              className="type-data"
              fill="var(--ink-mute)"
              fontSize="10"
            >
              tokens in one wallet →
            </text>
            <text
              x={px(1) + 10}
              y={py(perSeatEth) - 10}
              className="type-data"
              fill="var(--ink)"
              fontSize="11"
            >
              one seat, {formatEth(perSeat, 4)} ETH/day
            </text>
            <text
              x={px(xMax) - 6}
              y={py(perStakeEth * xMax) - 8}
              textAnchor="end"
              className="type-data"
              fill="var(--ink-mute)"
              fontSize="11"
            >
              token-weighted
            </text>
          </svg>
        </figure>

        <p className="type-body mt-4 max-w-[62ch] text-ink-soft">
          A wallet occupies one seat, and every seat in a clan is paid the same.
          So the line goes flat the moment the wallet can afford a stake, and it
          never rises again: past{" "}
          <span className="text-ink">{crossing.toFixed(1)} stakes</span> —{" "}
          {formatBps(Math.round(crossing * stakeBps * 100) / 100)} of supply — a
          token-weighted game would have paid this wallet better.
          Everything bought beyond that point is hatched above, and it earns
          nothing at all.
        </p>
      </div>

      <div className="space-y-5">
        <div className="sheet-sunk p-5">
          <Label>The ceiling</Label>
          <p className="type-figure-lg mt-2 text-ink">{formatBps(clanCeilingBps())}</p>
          <p className="type-body mt-2 text-ink-soft">
            The most of the fees one clan can ever take. {SEATS_PER_CLAN} seats hold{" "}
            {fullCapacity} hexes — {SEATS_PER_HEX} seats to a hex — and there are {HEX_COUNT} of
            them. No amount of money moves that number. Anyone may raise a
            banner, but ground only sustains about eight full ones, so getting
            near the ceiling means taking hexes off somebody who has them.
          </p>
        </div>

        <div className="sheet p-5">
          <Label>What a whale actually has to do</Label>
          <dl className="mt-3 divide-y divide-rule">
            {[
              ["Stake per seat", `${formatTokens(SEAT_STAKE)} ${"tokens"}`],
              ["Wallets for a full clan", `${SEATS_PER_CLAN}`],
              [
                "Supply that locks up",
                formatBps(Number((SEAT_STAKE * BigInt(SEATS_PER_CLAN) * 10_000n) / SUPPLY)),
              ],
              ["Votes it must cast, daily", `${SEATS_PER_CLAN}`],
              ["Musters it must answer", "every one, or lose the ground"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-2">
                <dt className="type-label text-ink-mute">{k}</dt>
                <dd className="type-data text-right text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="type-body mt-3 text-ink-soft">
            This does not keep a whale out, and pretending otherwise would be
            the easiest lie on the page. What it does is convert capital into
            obligation: fifty wallets that each have to be somewhere at a
            particular hour. Money buys the seats. It does not buy the
            attendance, and attendance is what the map is settled by.
          </p>
        </div>
      </div>
    </div>
  );
}
