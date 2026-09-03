/*
 * Runtime check of the claims this site makes in words.
 *
 * Every assertion below corresponds to a sentence printed on the page. If a
 * rule is ever relaxed — a tie starting to break for the attacker, a fee split
 * quietly becoming balance-weighted, an unowned share being dropped instead of
 * rolled — this breaks a command before it breaks a holder.
 *
 * Imports lose their `.ts` extension on purpose: tsconfig covers `**\/*.mts`
 * and the build's TypeScript pass rejects `.ts` specifiers without
 * `allowImportingTsExtensions`.
 */
import assert from "node:assert/strict";
import { board, readHex } from "../src/lib/board";
import {
  CLAN_BPS,
  FEE_BPS_BUY,
  FEE_BPS_SELL,
  SEAT_STAKE,
  SUPPLY,
  clanCeilingBps,
  clanEpochIncome,
  epochPot,
  seatIncome,
  seatIncomeForSeconds,
  seatsAffordable,
  settle,
  tokenWeightedIncome,
} from "../src/lib/economics";
import { HEX_COUNT, neighbourInDirection } from "../src/lib/hex";
import {
  DUG_IN_CAP,
  SEATS_PER_CLAN,
  SEATS_PER_HEX,
  dugIn,
  holdCapacity,
  resolve,
  seatsToBreak,
  seatsToHold,
} from "../src/lib/rules";

const WAD = 10n ** 18n;
let checks = 0;
function ok(cond: unknown, message: string) {
  assert.ok(cond, message);
  checks += 1;
}

/* ---------- the rule ------------------------------------------------- */

// A tie holds for the defender, with no margin either way.
ok(!resolve({ yes: 20, heldEpochs: 8, mustered: 12 }).taken, "20 v 20 holds");
ok(resolve({ yes: 21, heldEpochs: 8, mustered: 12 }).taken, "21 v 20 takes");
ok(
  resolve({ yes: 20, heldEpochs: 8, mustered: 12 }).short === 1,
  "a tied attack is short by exactly one seat",
);

// Dig-in is capped, so no holding becomes unkillable by age alone.
ok(dugIn(400) === DUG_IN_CAP, "dig-in caps");
ok(dugIn(-5) === 0, "dig-in never goes negative");
ok(
  seatsToBreak(999, 0) === DUG_IN_CAP + 1,
  "the oldest ground on the board falls to 13 seats if nobody answers",
);

// The two numbers the hex panel prints are the same two the rule uses.
for (const held of [0, 3, 12, 40]) {
  for (const mustered of [0, 7, 31]) {
    const need = seatsToBreak(held, mustered);
    ok(resolve({ yes: need, heldEpochs: held, mustered }).taken, `${need} takes ${held}/${mustered}`);
    ok(
      !resolve({ yes: need - 1, heldEpochs: held, mustered }).taken,
      `${need - 1} does not take ${held}/${mustered}`,
    );
  }
}

// A clan that cannot muster the difference cannot hold the ground. This is the
// sentence "a twelve-seat clan cannot keep ground next to a fifty-seat one".
ok(seatsToHold(40, 12, 12) === null, "12 seats cannot answer a 40-seat attack");
ok(seatsToHold(40, 12, 30) === 28, "30 available, 28 needed, so it holds");

/* ---------- ground and seats ----------------------------------------- */

ok(holdCapacity(SEATS_PER_CLAN) * SEATS_PER_HEX === SEATS_PER_CLAN, "50 seats, 25 hexes");
ok(
  holdCapacity(SEATS_PER_CLAN) * 8 <= HEX_COUNT && holdCapacity(SEATS_PER_CLAN) * 9 > HEX_COUNT,
  "the board fits eight full clans and not nine — the shortfall the site claims",
);
ok(
  clanCeilingBps() === Math.floor((holdCapacity(SEATS_PER_CLAN) * 10_000) / HEX_COUNT),
  "the printed ceiling is the capacity over the board",
);

/* ---------- the money ------------------------------------------------- */

// 100% to clans has to be literally true: it is in the headline.
ok(CLAN_BPS === 10_000, "nothing is skimmed");
const pot = epochPot(600n * WAD, 400n * WAD);
ok(
  pot === (600n * WAD * BigInt(FEE_BPS_BUY)) / 10_000n + (400n * WAD * BigInt(FEE_BPS_SELL)) / 10_000n,
  "the pot is exactly the two-sided fee",
);

// Settlement conserves value. Unowned shares roll; nothing is dropped.
for (const owned of [0, 1, 100, HEX_COUNT]) {
  const s = settle(pot, 3n * WAD, owned);
  ok(s.paid + s.rolled === pot + 3n * WAD, `settle conserves at ${owned} owned`);
  ok(s.paid === s.perHex * BigInt(owned), `only owned hexes are paid at ${owned}`);
}
ok(settle(pot, 0n, 0).rolled === pot, "an empty board rolls the whole pot");

// THE claim: a seat pays a seat. Income does not move with balance.
const perHex = settle(pot, 0n, HEX_COUNT).perHex;
const clanIncome = clanEpochIncome(perHex, holdCapacity(SEATS_PER_CLAN));
const perSeat = seatIncome(clanIncome, SEATS_PER_CLAN);
for (const stakes of [1n, 2n, 10n, 1_000n]) {
  ok(
    seatIncome(clanIncome, SEATS_PER_CLAN) === perSeat,
    `a wallet holding ${stakes} stakes is paid one seat's share`,
  );
}
ok(seatsAffordable(SEAT_STAKE * 3n) === 3, "three stakes buy three seats — in three wallets");

// And the crossing the chart marks: a seat beats a stake's token-weighted
// share, which is only true because seat-holders are a subset of holders.
const perStake = tokenWeightedIncome(pot, SEAT_STAKE);
ok(perStake > 0n, "a token-weighted split pays something per stake");
ok(perSeat > perStake, "one seat beats one stake under weighting — the chart's step");
const crossing = Number(perSeat) / Number(perStake);
ok(crossing > 1 && crossing < Number(SUPPLY / SEAT_STAKE), "the crossing is on the chart");

// Part-epoch seats are paid by the second, so a seat taken at the bell earns
// a bell's worth and no more.
const day = 86_400;
ok(seatIncomeForSeconds(clanIncome, day * SEATS_PER_CLAN, day) === perSeat, "a full seat-day");
ok(
  seatIncomeForSeconds(clanIncome, day * SEATS_PER_CLAN, 60) < perSeat / 1_000n,
  "a seat taken a minute before the bell is paid a minute",
);

/* ---------- the board the site actually draws ------------------------- */

const b = board();
ok(b.ownedHexes + b.neutralHexes === HEX_COUNT, "every hex is owned or grass");
ok(b.clans.length === 12, "twelve clans");
for (const c of b.clans) {
  ok(c.seats <= SEATS_PER_CLAN, `${c.tag} is inside the cap`);
  ok(c.hexes <= c.capacity, `${c.tag} holds no more ground than it can man`);
  ok(
    (c.hexes * 10_000) / HEX_COUNT <= clanCeilingBps() + 1,
    `${c.tag} is under the ceiling the site prints`,
  );
  ok(c.perSeat === seatIncome(c.lastEpoch, c.seats), `${c.tag}'s per-seat figure is derived`);
}

// Fronts: both sides of every drawn border really are different clans. This is
// what catches an off-by-one in the direction-to-corner mapping, which would
// otherwise produce a plausible-looking map with every border one facet round.
for (const f of b.fronts) {
  const across = neighbourInDirection(f.hex, f.dir);
  ok(across !== null, "a front never points off the board");
  ok(b.owner[f.hex] === f.own, "a front's own side is the hex's owner");
  ok(across !== null && b.owner[across] === f.other, "a front's far side is the other clan");
}

// The panel's two costs bracket each other: answering can only make it dearer.
for (const id of [0, 47, 108, 190, HEX_COUNT - 1]) {
  const r = readHex(id);
  if (r.owner < 0) continue;
  ok(r.costIfAnswered >= r.costIfNobodyAnswers, `hex ${id}: answering never helps the attacker`);
  ok(r.dugIn <= DUG_IN_CAP, `hex ${id}: dig-in inside the cap`);
}

// Open votes are legal moves: adjacent, and against somebody else.
for (const w of b.wars) {
  ok(b.owner[w.hex] === w.defender, "a vote targets the defender's hex");
  ok(w.attacker !== w.defender, "nobody attacks themselves");
  ok(w.yes <= (b.clans.find((c) => c.id === w.attacker)?.seats ?? 0), "no more votes than seats");
  ok(
    w.mustered <= (b.clans.find((c) => c.id === w.defender)?.seats ?? 0),
    "no more answers than seats",
  );
}

console.log(`ok — ${checks} checks passed`);
