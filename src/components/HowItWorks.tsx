/**
 * Three steps, twice, then the wars themselves.
 *
 * The two bands are drawn identically on purpose — same numeral, same rule
 * above them — so a reader sees that the game has exactly two loops and that
 * both are three steps long. A game whose explanation needs a diagram with
 * arrows is a game nobody plays from a phone.
 */

import { WarCard, WarList } from "@/components/War";
import { Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import { SEAT_STAKE, formatTokens } from "@/lib/economics";
import { HEX_COUNT } from "@/lib/hex";
import {
  DUG_IN_CAP,
  MUSTER_HOURS,
  SEATS_PER_CLAN,
  SEATS_PER_HEX,
  holdCapacity,
} from "@/lib/rules";

function Band({
  label,
  steps,
}: {
  label: string;
  steps: { head: string; body: React.ReactNode }[];
}) {
  return (
    <div>
      <Label className="text-gold">{label}</Label>
      <ol className="mt-4 grid gap-px border border-rule bg-rule sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.head} className="bg-field p-5">
            <span className="type-data text-gold">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="type-title mt-2 text-chalk">{s.head}</h3>
            <p className="type-body mt-2 text-chalk-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowItWorks() {
  const b = board();

  return (
    <div className="space-y-10">
      <div>
        <h2 className="type-title text-chalk">The game in four lines</h2>
        <ul className="mt-4 max-w-[70ch] space-y-2">
          {[
            `The map is ${HEX_COUNT} hexes. Clans hold them; ${SEATS_PER_HEX} seats hold one hex.`,
            `A clan is ${SEATS_PER_CLAN} people, one wallet each. That cap is the whole design.`,
            "Every trade pays a 2% fee. All of it goes to the clans holding ground, split equally between their seats.",
            `To take a hex off somebody, your clan votes for it in public and the vote stands open for ${MUSTER_HOURS} hours. Whoever got more of their fifty to show up wins it.`,
          ].map((line, i) => (
            <li key={i} className="flex gap-3">
              <span className="type-label mt-1 shrink-0 text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="type-body text-chalk-soft">{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <Band
        label="How a holder earns"
        steps={[
          {
            head: "Take a seat",
            body: (
              <>
                Lock {formatTokens(SEAT_STAKE)} tokens and sit in one of a clan&apos;s{" "}
                {SEATS_PER_CLAN} seats. One wallet, one seat. When the fifty are full the
                clan is closed until somebody leaves.
              </>
            ),
          },
          {
            head: "Hold ground",
            body: (
              <>
                Every {SEATS_PER_HEX} seats let the clan hold one hex, so a full clan holds{" "}
                {holdCapacity(SEATS_PER_CLAN)} of the {HEX_COUNT} on the board. Claiming
                empty ground costs a seat for the day. Taking held ground costs a war.
              </>
            ),
          },
          {
            head: "Split the fee",
            body: (
              <>
                Every trade pays 2%. It is cut into {HEX_COUNT} equal shares, one per hex,
                and each clan&apos;s share is split equally between its filled seats. Not
                by balance — by seat.
              </>
            ),
          },
        ]}
      />

      <Band
        label="How ground moves"
        steps={[
          {
            head: "Somebody proposes",
            body: (
              <>
                Any member can put a neighbouring hex to the vote — only one touching
                ground the clan already holds. There is no landing behind enemy lines.
              </>
            ),
          },
          {
            head: "Twelve hours, in the open",
            body: (
              <>
                The vote stands open for {MUSTER_HOURS} hours and both sides read it. Each
                seat that votes yes is committed until seats refresh, and the defender is
                calling everyone it has.
              </>
            ),
          },
          {
            head: "It resolves itself",
            body: (
              <>
                Attack is the yes votes. Defence is up to {DUG_IN_CAP} points for holding
                the ground, plus every defending seat that answered. Higher takes it; a tie
                holds for the defender.
              </>
            ),
          },
        ]}
      />

      <div>
        <Label className="text-gold">What a war looks like while it is being voted on</Label>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {b.wars.map((w) => (
            <WarCard key={`${w.attacker}-${w.hex}`} w={w} />
          ))}
        </div>
      </div>

      <WarList />
    </div>
  );
}
