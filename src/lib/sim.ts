/**
 * The season, played out.
 *
 * Nothing is deployed, so there is no chain to read and the honest options
 * are an empty board or a simulated one. An empty board explains nothing, and
 * a board of hand-typed numbers is worse than either: it can say whatever the
 * page needs it to say, including things the rules do not permit.
 *
 * So the board comes from here — seventy-four epochs played by the same
 * functions in `rules.ts` and `economics.ts` that a deployed version would
 * call. It is deterministic from one seed, which means server and client
 * render the same map and a change to the rule visibly moves the map instead
 * of quietly disagreeing with it. Every figure on the site that is not marked
 * as a constant comes out of this run.
 *
 * The one thing it is not is real, and the site says so where the map is.
 */

import { HEX_COUNT, hexAt, hexes, neighbours } from "./hex";
import {
  DUG_IN_CAP,
  SEATS_PER_CLAN,
  dugIn,
  holdCapacity,
  resolve,
} from "./rules";
import { WAD, clanEpochIncome, epochPot, settle } from "./economics";

export const SEASON_EPOCHS = 74;
const SEED = 0x9e3719b1;

/** Deterministic, cheap, and good enough for a board nobody bets on. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type ClanSeed = {
  name: string;
  tag: string;
  /** Index into the printed clan inks; see globals.css. */
  ink: number;
  home: [number, number];
  /** Share of seats that typically answers a muster. The social variable. */
  discipline: number;
  /** How often the clan opens a war vote. */
  aggression: number;
  /** Seats it can realistically recruit. Not every clan fills. */
  reach: number;
  /** Where the clan talks. Names only — nothing here resolves to a real room. */
  room: string;
};

const SEEDS: ClanSeed[] = [
  { name: "Ironworks",   tag: "IW", ink: 0,  home: [4, 0],   discipline: 0.82, aggression: 0.44, reach: 50, room: "discord/ironworks" },
  { name: "Salt Road",   tag: "SR", ink: 1,  home: [0, 4],   discipline: 0.74, aggression: 0.30, reach: 50, room: "t.me/saltroad" },
  { name: "Nine Pines",  tag: "NP", ink: 2,  home: [-4, 4],  discipline: 0.69, aggression: 0.26, reach: 46, room: "discord/ninepines" },
  { name: "Cold Open",   tag: "CO", ink: 3,  home: [-4, 0],  discipline: 0.58, aggression: 0.34, reach: 38, room: "t.me/coldopen" },
  { name: "Ferrymen",    tag: "FM", ink: 4,  home: [0, -4],  discipline: 0.77, aggression: 0.22, reach: 50, room: "discord/ferrymen" },
  { name: "Blackstack",  tag: "BK", ink: 5,  home: [4, -4],  discipline: 0.86, aggression: 0.52, reach: 50, room: "t.me/blackstack" },
  { name: "Meridian",    tag: "MD", ink: 6,  home: [7, -3],  discipline: 0.63, aggression: 0.28, reach: 42, room: "discord/meridian" },
  { name: "Halflight",   tag: "HF", ink: 7,  home: [4, 3],   discipline: 0.47, aggression: 0.20, reach: 27, room: "t.me/halflight" },
  { name: "Dry Dock",    tag: "DD", ink: 8,  home: [-3, 7],  discipline: 0.71, aggression: 0.31, reach: 44, room: "discord/drydock" },
  { name: "Pale Horse",  tag: "PH", ink: 9,  home: [-7, 3],  discipline: 0.55, aggression: 0.38, reach: 33, room: "t.me/palehorse" },
  { name: "Gravel Co",   tag: "GV", ink: 10, home: [-4, -3], discipline: 0.44, aggression: 0.18, reach: 21, room: "discord/gravel" },
  { name: "Longshore",   tag: "LS", ink: 11, home: [3, -7],  discipline: 0.66, aggression: 0.35, reach: 40, room: "t.me/longshore" },
];

export type Battle = {
  epoch: number;
  attacker: number;
  defender: number;
  hex: number;
  attack: number;
  defence: number;
  dugIn: number;
  mustered: number;
  taken: boolean;
};

export type ClanState = {
  id: number;
  seed: ClanSeed;
  seats: number;
  hexes: number[];
  /** Fees earned across the season, in wei. */
  treasury: bigint;
  /** Fees earned in the final epoch, in wei. */
  lastEpoch: bigint;
  wonAttacks: number;
  lostAttacks: number;
  heldOff: number;
  overrun: number;
};

/** A war vote standing open at the moment the board is shown. */
export type OpenWar = {
  attacker: number;
  defender: number;
  hex: number;
  /** Attacking seats that have voted yes so far. */
  yes: number;
  /** Defending seats that have answered so far. */
  mustered: number;
  /** Minutes left in the twelve-hour window. */
  minutesLeft: number;
};

export type Season = {
  epoch: number;
  /** Owner clan id per hex, or -1. Indexed by hex id. */
  owner: Int8Array;
  /** Epochs the current owner has held each hex. */
  held: Int16Array;
  clans: ClanState[];
  battles: Battle[];
  wars: OpenWar[];
  /** Fees cut per hex in the final epoch, in wei. */
  perHex: bigint;
  /** Unowned shares carried into the next epoch, in wei. */
  carried: bigint;
  /** The final epoch's pot, in wei. */
  pot: bigint;
  /** Two-sided volume in the final epoch, in wei. */
  volume: bigint;
};

function playSeason(): Season {
  const rng = mulberry32(SEED);
  const owner = new Int8Array(HEX_COUNT).fill(-1);
  const held = new Int16Array(HEX_COUNT);

  const clans: ClanState[] = SEEDS.map((seed, id) => ({
    id,
    seed,
    seats: 2,
    hexes: [],
    treasury: 0n,
    lastEpoch: 0n,
    wonAttacks: 0,
    lostAttacks: 0,
    heldOff: 0,
    overrun: 0,
  }));

  // Founding claim: every clan starts on its home hex.
  for (const clan of clans) {
    const home = hexAt(clan.seed.home[0], clan.seed.home[1]);
    if (home === null) throw new Error(`clan ${clan.seed.tag} has no home hex`);
    owner[home] = clan.id;
    clan.hexes.push(home);
  }

  const battles: Battle[] = [];
  let carried = 0n;
  let perHex = 0n;
  let pot = 0n;
  let volume = 0n;

  for (let epoch = 1; epoch <= SEASON_EPOCHS; epoch++) {
    /* -- recruiting -------------------------------------------------- */
    for (const clan of clans) {
      if (clan.seats >= clan.seed.reach) continue;
      // Growth is fastest in the middle of a clan's life: nobody joins a clan
      // of two, and the last seats of a clan of fifty are the hardest to fill.
      const room = clan.seed.reach - clan.seats;
      const pull = 0.35 + 0.5 * (clan.seats / clan.seed.reach) * (room / clan.seed.reach) * 4;
      if (rng() < Math.min(0.92, pull)) {
        clan.seats = Math.min(clan.seed.reach, clan.seats + 1 + (rng() < 0.28 ? 1 : 0));
      }
    }

    /* -- fees ---------------------------------------------------------- */
    // A volume series with a launch bump and a long fade, so the epoch the
    // site shows is an ordinary one rather than the best one.
    const wave = 1 + 0.55 * Math.exp(-epoch / 9) + 0.22 * Math.sin(epoch / 3.1);
    const dayVolume = BigInt(Math.round(wave * 420 * (0.85 + rng() * 0.3))) * WAD;
    const buy = (dayVolume * 52n) / 100n;
    const sell = dayVolume - buy;
    pot = epochPot(buy, sell);
    volume = dayVolume;

    const ownedCount = clans.reduce((n, c) => n + c.hexes.length, 0);
    const settlement = settle(pot, carried, ownedCount);
    perHex = settlement.perHex;
    carried = settlement.rolled;
    for (const clan of clans) {
      const income = clanEpochIncome(perHex, clan.hexes.length);
      clan.treasury += income;
      clan.lastEpoch = income;
    }

    /* -- the epoch's actions ------------------------------------------- */
    // Order matters — the clan that moves first picks from a fuller board —
    // so it is shuffled from the seed rather than left as declaration order.
    // Fisher-Yates and not `sort(() => rng() - 0.5)`: a random comparator
    // calls the engine's sort an implementation-defined number of times, so
    // the "deterministic" run would stop being deterministic across engines,
    // and this board is rendered on the server and again in the browser.
    const order = clans.map((c) => c.id);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    for (const id of order) {
      const clan = clans[id];
      let seatsLeft = clan.seats;
      let room = holdCapacity(clan.seats) - clan.hexes.length;

      /* Claim neutral ground first: it costs one seat and nobody is hurt. */
      let claims = 0;
      while (room > 0 && seatsLeft >= 1 && claims < 2) {
        const frontier: number[] = [];
        for (const h of clan.hexes) {
          for (const n of neighbours[h]) if (owner[n] === -1) frontier.push(n);
        }
        if (frontier.length === 0) break;
        if (rng() > 0.72) break;
        const target = frontier[Math.floor(rng() * frontier.length)];
        owner[target] = clan.id;
        held[target] = 0;
        clan.hexes.push(target);
        seatsLeft -= 1;
        room -= 1;
        claims += 1;
      }

      /* Then, maybe, a war. */
      if (room <= 0 || seatsLeft < 4 || rng() > clan.seed.aggression) continue;

      const targets: { hex: number; defender: number; cost: number }[] = [];
      for (const h of clan.hexes) {
        for (const n of neighbours[h]) {
          const def = owner[n];
          if (def === -1 || def === clan.id) continue;
          const defender = clans[def];
          const expectedMuster = Math.round(defender.seats * defender.seed.discipline * 0.75);
          targets.push({ hex: n, defender: def, cost: dugIn(held[n]) + expectedMuster + 1 });
        }
      }
      if (targets.length === 0) continue;
      targets.sort((a, b) => a.cost - b.cost);
      const pick = targets[0];
      if (pick.cost > seatsLeft) continue;

      const defender = clans[pick.defender];
      // The attacker commits what it thinks it needs plus a little, never all
      // of itself — a clan that empties its muster on one hex loses three.
      const yes = Math.min(seatsLeft, pick.cost + (rng() < 0.5 ? 1 : 3));
      const mustered = Math.min(
        defender.seats,
        Math.round(defender.seats * defender.seed.discipline * (0.55 + rng() * 0.75)),
      );
      const out = resolve({ yes, heldEpochs: held[pick.hex], mustered });
      battles.push({
        epoch,
        attacker: clan.id,
        defender: pick.defender,
        hex: pick.hex,
        attack: out.attack,
        defence: out.defence,
        dugIn: dugIn(held[pick.hex]),
        mustered,
        taken: out.taken,
      });

      if (out.taken) {
        defender.hexes = defender.hexes.filter((h) => h !== pick.hex);
        defender.overrun += 1;
        owner[pick.hex] = clan.id;
        held[pick.hex] = 0;
        clan.hexes.push(pick.hex);
        clan.wonAttacks += 1;
      } else {
        clan.lostAttacks += 1;
        defender.heldOff += 1;
      }
    }

    /* -- ground settles ------------------------------------------------ */
    for (let i = 0; i < HEX_COUNT; i++) if (owner[i] !== -1) held[i] += 1;
  }

  /* -- what is standing open right now ---------------------------------- */
  const wars: OpenWar[] = [];
  const contested: { attacker: number; defender: number; hex: number }[] = [];
  for (let i = 0; i < HEX_COUNT; i++) {
    const def = owner[i];
    if (def === -1) continue;
    for (const n of neighbours[i]) {
      const att = owner[n];
      if (att === -1 || att === def) continue;
      if (holdCapacity(clans[att].seats) - clans[att].hexes.length <= 0) continue;
      contested.push({ attacker: att, defender: def, hex: i });
    }
  }
  contested.sort(
    (a, b) =>
      clans[b.attacker].seats - clans[a.attacker].seats ||
      held[a.hex] - held[b.hex] ||
      a.hex - b.hex,
  );
  const used = new Set<number>();
  for (const c of contested) {
    if (wars.length >= 2) break;
    if (used.has(c.attacker) || used.has(c.defender)) continue;
    const attacker = clans[c.attacker];
    const defender = clans[c.defender];
    const minutesLeft = wars.length === 0 ? 214 : 47;
    // Both sides part-way through the window: the attacker still gathering
    // votes, the defender still waking people up.
    const progress = 1 - minutesLeft / (12 * 60);
    wars.push({
      attacker: c.attacker,
      defender: c.defender,
      hex: c.hex,
      yes: Math.max(6, Math.round(attacker.seats * 0.62 * (0.5 + progress * 0.6))),
      mustered: Math.round(defender.seats * defender.seed.discipline * progress * 0.9),
      minutesLeft,
    });
    used.add(c.attacker);
    used.add(c.defender);
  }

  for (const clan of clans) clan.hexes.sort((a, b) => a - b);

  return {
    epoch: SEASON_EPOCHS,
    owner,
    held,
    clans,
    battles: battles.slice(-20),
    wars,
    perHex,
    carried,
    pot,
    volume,
  };
}

let cached: Season | null = null;

/** The season. Played once per process, then handed round. */
export function season(): Season {
  if (!cached) cached = playSeason();
  return cached;
}

export { DUG_IN_CAP, SEATS_PER_CLAN, hexes };
