/**
 * One shape of board, one source.
 *
 * Every component reads the board through here and none of them knows where
 * it came from. Today the source is `sim.ts`; the day an indexer exists it
 * becomes the source and not one component changes, because there is no
 * second, untested code path for the live case to fall down.
 *
 * The derived thing this file exists for is the FRONT: the set of edges where
 * two different clans touch. It is the only structure on the board that is
 * about relationships rather than tiles, it is the thing the whole game turns
 * on, and it is the only heavy line on the map.
 */

import { HEX_COUNT, hexes, neighbours } from "./hex";
import { SEATS_PER_CLAN, dugIn, holdCapacity, seatsToBreak } from "./rules";
import { seatIncome } from "./economics";
import { season, type Battle, type ClanState, type OpenWar } from "./sim";

export type Front = {
  hex: number;
  /** Direction index into the hex's edges. See `edgeCorners` in hex.ts. */
  dir: number;
  /** The clan on this side. */
  own: number;
  /** The clan on the other side. */
  other: number;
};

export type ClanRow = {
  id: number;
  name: string;
  tag: string;
  ink: number;
  room: string;
  discipline: number;
  seats: number;
  /** Hexes the clan could hold if it filled every seat it has. */
  capacity: number;
  hexes: number;
  /** Fees this clan took in the last epoch, in wei. */
  lastEpoch: bigint;
  /** What one seat took in the last epoch, in wei. */
  perSeat: bigint;
  treasury: bigint;
  wonAttacks: number;
  lostAttacks: number;
  heldOff: number;
  overrun: number;
  /** Clan ids this clan shares a border with. */
  borders: number[];
  /** True when the clan has run out of seats to hold more ground. */
  atCapacity: boolean;
};

export type HexReading = {
  id: number;
  owner: number;
  held: number;
  dugIn: number;
  /** Neighbouring clans, excluding the owner and neutral ground. */
  threats: number[];
  /** Seats an attacker needs if nobody in the owning clan answers. */
  costIfNobodyAnswers: number;
  /** Seats an attacker needs if the owner musters what it usually musters. */
  costIfAnswered: number;
};

export type Board = {
  epoch: number;
  owner: Int8Array;
  held: Int16Array;
  clans: ClanRow[];
  fronts: Front[];
  battles: Battle[];
  wars: OpenWar[];
  ownedHexes: number;
  neutralHexes: number;
  perHex: bigint;
  carried: bigint;
  pot: bigint;
  volume: bigint;
  totalSeats: number;
};

function rowOf(clan: ClanState, borders: Set<number>): ClanRow {
  return {
    id: clan.id,
    name: clan.seed.name,
    tag: clan.seed.tag,
    ink: clan.seed.ink,
    room: clan.seed.room,
    discipline: clan.seed.discipline,
    seats: clan.seats,
    capacity: holdCapacity(clan.seats),
    hexes: clan.hexes.length,
    lastEpoch: clan.lastEpoch,
    perSeat: seatIncome(clan.lastEpoch, clan.seats),
    treasury: clan.treasury,
    wonAttacks: clan.wonAttacks,
    lostAttacks: clan.lostAttacks,
    heldOff: clan.heldOff,
    overrun: clan.overrun,
    borders: [...borders].sort((a, b) => a - b),
    atCapacity: holdCapacity(clan.seats) <= clan.hexes.length,
  };
}

function derive(): Board {
  const s = season();
  const fronts: Front[] = [];
  const borders = s.clans.map(() => new Set<number>());
  let owned = 0;

  for (let i = 0; i < HEX_COUNT; i++) {
    const own = s.owner[i];
    if (own === -1) continue;
    owned += 1;
    const ns = neighbours[i];
    for (let d = 0; d < ns.length; d++) {
      const other = s.owner[ns[d]];
      if (other === -1 || other === own) continue;
      // Which of the six directions this neighbour actually lies in — `ns` is
      // built in direction order but skips off-board neighbours, so the array
      // index is not the direction on rim hexes.
      const dir = directionOf(i, ns[d]);
      if (dir >= 0) fronts.push({ hex: i, dir, own, other });
      borders[own].add(other);
    }
  }

  const clans = s.clans
    .map((c) => rowOf(c, borders[c.id]))
    .sort((a, b) => b.hexes - a.hexes || b.seats - a.seats);

  return {
    epoch: s.epoch,
    owner: s.owner,
    held: s.held,
    clans,
    fronts,
    battles: [...s.battles].reverse(),
    wars: s.wars,
    ownedHexes: owned,
    neutralHexes: HEX_COUNT - owned,
    perHex: s.perHex,
    carried: s.carried,
    pot: s.pot,
    volume: s.volume,
    totalSeats: s.clans.reduce((n, c) => n + c.seats, 0),
  };
}

function directionOf(from: number, to: number): number {
  const a = hexes[from];
  const b = hexes[to];
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  if (dq === 1 && dr === 0) return 0;
  if (dq === 1 && dr === -1) return 1;
  if (dq === 0 && dr === -1) return 2;
  if (dq === -1 && dr === 0) return 3;
  if (dq === -1 && dr === 1) return 4;
  if (dq === 0 && dr === 1) return 5;
  return -1;
}

let cached: Board | null = null;

export function board(): Board {
  if (!cached) cached = derive();
  return cached;
}

export function clanById(id: number): ClanRow | null {
  return board().clans.find((c) => c.id === id) ?? null;
}

/** Everything the inspector says about one hex, derived, never stored. */
export function readHex(id: number): HexReading {
  const b = board();
  const owner = b.owner[id];
  const held = b.held[id];
  const threats = new Set<number>();
  for (const n of neighbours[id]) {
    const o = b.owner[n];
    if (o !== -1 && o !== owner) threats.add(o);
  }
  const clan = owner === -1 ? null : clanById(owner);
  const usual = clan ? Math.round(clan.seats * clan.discipline * 0.75) : 0;
  return {
    id,
    owner,
    held,
    dugIn: dugIn(held),
    threats: [...threats].sort((a, b2) => a - b2),
    costIfNobodyAnswers: owner === -1 ? 1 : seatsToBreak(held, 0),
    costIfAnswered: owner === -1 ? 1 : seatsToBreak(held, usual),
  };
}

/** Hexes owned by a clan, for outlining a whole territory. */
export function territory(clanId: number): number[] {
  const b = board();
  const out: number[] = [];
  for (let i = 0; i < HEX_COUNT; i++) if (b.owner[i] === clanId) out.push(i);
  return out;
}

/** Fronts between exactly these two clans, in either direction. */
export function frontBetween(a: number, b: number): Front[] {
  return board().fronts.filter(
    (f) => (f.own === a && f.other === b) || (f.own === b && f.other === a),
  );
}

export { SEATS_PER_CLAN };
export type { Battle, OpenWar };
