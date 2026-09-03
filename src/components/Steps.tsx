/**
 * Three steps, twice.
 *
 * The first band is how a holder earns; the second is how ground moves. They
 * are drawn identically on purpose — same numeral, same rule above it — so
 * the reader sees that the game has exactly two loops and that both of them
 * are three steps long. A game whose explanation needs a diagram with arrows
 * is a game nobody will play from a phone.
 */

import { Label } from "@/components/ui/Label";
import { formatTokens } from "@/lib/economics";
import { SEAT_STAKE } from "@/lib/economics";
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
      <Label>{label}</Label>
      <ol className="mt-4 grid gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.head} className="bg-paper-lit p-5">
            <span className="type-data text-ink-mute">{i + 1}</span>
            <h3 className="type-head mt-2 text-ink">{s.head}</h3>
            <p className="type-body mt-2 text-ink-soft">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Steps() {
  return (
    <div className="space-y-10">
      <Band
        label="How a holder earns"
        steps={[
          {
            head: "Take a seat",
            body: (
              <>
                Lock {formatTokens(SEAT_STAKE)} tokens and sit in one of a clan&apos;s{" "}
                {SEATS_PER_CLAN} seats. One wallet, one seat. When the fifty are
                full, the clan is closed until somebody leaves.
              </>
            ),
          },
          {
            head: "Hold ground",
            body: (
              <>
                Every {SEATS_PER_HEX} seats let the clan hold one hex, so a full clan
                holds {holdCapacity(SEATS_PER_CLAN)} of the {HEX_COUNT} on the board.
                Claiming empty ground costs a seat for the day. Taking held ground
                costs a war.
              </>
            ),
          },
          {
            head: "Split the fee",
            body: (
              <>
                Every trade pays 2%. It is cut into {HEX_COUNT} equal shares, one per
                hex, and each clan&apos;s share is split equally between its filled
                seats. Not by balance — by seat.
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
                Any member can put a neighbouring hex to the vote. Only a hex
                touching ground the clan already holds — there is no landing
                behind enemy lines.
              </>
            ),
          },
          {
            head: "Twelve hours, in the open",
            body: (
              <>
                The vote stands open for {MUSTER_HOURS} hours and both sides can read
                it. Each seat that votes yes is committed until seats refresh, and
                the defender is calling everyone it has.
              </>
            ),
          },
          {
            head: "It resolves itself",
            body: (
              <>
                Attack is the yes votes. Defence is up to {DUG_IN_CAP} points for
                holding the ground, plus every defending seat that answered. Higher
                takes it; a tie holds for the defender.
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
