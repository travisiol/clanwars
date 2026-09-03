/**
 * The rule.
 *
 * Five constants and one comparison. Everything the site claims about power,
 * ceilings and whales falls out of these; nothing else in the codebase gets
 * to invent a number about how a fight is settled.
 *
 * The load-bearing choice is that **power is counted in seats, not tokens**.
 * A clan's strength is how many of its fifty people showed up, and a seat
 * costs exactly one stake whether the wallet behind it holds one stake or a
 * thousand. That is what makes the map something you cannot simply buy: the
 * scarce input is not capital, it is fifty separate people answering a call
 * inside a twelve-hour window.
 *
 * Second choice: an attack is **announced**. The vote is on chain and open
 * for twelve hours before it resolves, so the defender always sees it coming.
 * A surprise-attack game rewards being awake at 4am; an announced-attack game
 * rewards having a group chat. The second one is the game this is.
 */

/** Seats in a clan. The cap is the product. */
export const SEATS_PER_CLAN = 50;

/**
 * Seats needed to hold one hex. Ground you cannot man, you cannot hold — so a
 * full clan tops out at 25 hexes of 217, and roughly nine full clans would
 * fill the board. There is never room for all of them.
 */
export const SEATS_PER_HEX = 2;

/**
 * Days of quiet possession that count as fortification, and the ceiling on
 * them. Capped because an uncapped dig-in makes an old holding unkillable,
 * and a map where nothing can change hands is a leaderboard, not a game.
 */
export const DUG_IN_CAP = 12;

/** One epoch. Seats refresh, fees settle, dig-in ticks up. */
export const EPOCH_HOURS = 24;

/** How long a war vote stands open, and therefore how long a muster has. */
export const MUSTER_HOURS = 12;

/** Hexes a clan with this many filled seats is allowed to hold. */
export function holdCapacity(seats: number): number {
  return Math.floor(seats / SEATS_PER_HEX);
}

/** Fortification earned by holding, in points. */
export function dugIn(heldEpochs: number): number {
  return Math.min(Math.max(0, Math.floor(heldEpochs)), DUG_IN_CAP);
}

export type Assault = {
  /** Attacking seats that voted yes. Each is committed until the next epoch. */
  yes: number;
  /** Epochs the defender has held the hex without interruption. */
  heldEpochs: number;
  /** Defending seats that answered the muster inside the window. */
  mustered: number;
};

export type Outcome = {
  attack: number;
  defence: number;
  taken: boolean;
  /** Seats the attacker was short by, or 0 if it landed. */
  short: number;
};

/**
 * Settle one assault.
 *
 * Strictly greater, with no margin either way. A tie holds for the defender
 * because the defender is the one who has to be woken up: if a draw took the
 * hex, the attacker's cheapest play would be to match the garrison exactly
 * and let the clock do the rest.
 */
export function resolve({ yes, heldEpochs, mustered }: Assault): Outcome {
  const attack = Math.max(0, Math.floor(yes));
  const defence = dugIn(heldEpochs) + Math.max(0, Math.floor(mustered));
  const taken = attack > defence;
  return { attack, defence, taken, short: taken ? 0 : defence - attack + 1 };
}

/** Seats an attacker needs to break a given garrison. */
export function seatsToBreak(heldEpochs: number, mustered: number): number {
  return dugIn(heldEpochs) + Math.max(0, Math.floor(mustered)) + 1;
}

/**
 * Seats a defender must muster to be safe from a given attack, or null when
 * the clan cannot get there — which is the whole reason a twelve-seat clan
 * cannot keep ground next to a fifty-seat one.
 */
export function seatsToHold(
  yes: number,
  heldEpochs: number,
  availableSeats: number,
): number | null {
  const needed = Math.max(0, yes - dugIn(heldEpochs));
  return needed <= availableSeats ? needed : null;
}
