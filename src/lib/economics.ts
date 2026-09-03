/**
 * The money.
 *
 * Integers end to end, in wei, with no floating point anywhere a figure the
 * site prints could come from. Rounding is always down and the remainder is
 * always kept, never dropped — a fee split that loses dust is a fee split
 * that has to be explained, and this one has enough to explain already.
 *
 * The whole distribution is two divisions:
 *
 *   1. The epoch's fees are cut into 217 equal shares, one per hex. Every hex
 *      pays the same. There are no tiers, no capital square, no golden centre
 *      — what differs between two hexes is who is standing next to them.
 *      Shares belonging to hexes nobody owns are not paid; they roll into the
 *      next epoch, so an empty board makes the next one worth more.
 *
 *   2. A clan's take is cut equally among its filled seats, pro rata to the
 *      seconds each seat was held during the epoch.
 *
 * That second division is the one the whole design stands on. **A seat pays a
 * seat.** The wallet in seat 7 with a thousand stakes is paid exactly what the
 * wallet in seat 8 with one stake is paid. Buying more tokens than one stake
 * earns nothing at all — which is a sentence that is either true in this file
 * or false everywhere on the site, so `npm run check` asserts it.
 */

import { HEX_COUNT } from "@/lib/hex";
import { SEATS_PER_CLAN } from "@/lib/rules";

const WAD = 10n ** 18n;

/** Fixed supply, no mint. */
export const SUPPLY = 1_000_000_000n * WAD;

/**
 * One seat's stake, 0.05% of supply. Fixed in tokens, not in value: a stake
 * priced in dollars would quietly lock out the people the cap exists to make
 * room for as soon as the token moved.
 */
export const SEAT_STAKE = SUPPLY / 2_000n;

/** A full clan's locked stake: fifty seats, 2.5% of supply. */
export const CLAN_STAKE = SEAT_STAKE * BigInt(SEATS_PER_CLAN);

/** Trading fee, both sides, in basis points. */
export const FEE_BPS_BUY = 200;
export const FEE_BPS_SELL = 200;

/**
 * Share of the fee that reaches clans, in basis points. Ten thousand: all of
 * it. The page says fees go to the clans, so that has to be literally true —
 * a headline number with an asterisk costs more credibility than the skim
 * would ever raise.
 */
export const CLAN_BPS = 10_000;

export function feeOn(volume: bigint, bps: number): bigint {
  return (volume * BigInt(bps)) / 10_000n;
}

/** Fees an epoch's two-sided volume hands to the clans. */
export function epochPot(buyVolume: bigint, sellVolume: bigint): bigint {
  const gross = feeOn(buyVolume, FEE_BPS_BUY) + feeOn(sellVolume, FEE_BPS_SELL);
  return (gross * BigInt(CLAN_BPS)) / 10_000n;
}

export type Settlement = {
  /** Paid to whoever owns each hex. */
  perHex: bigint;
  /** Total actually paid out this epoch. */
  paid: bigint;
  /** Unowned shares plus the division's remainder, carried forward. */
  rolled: bigint;
};

/**
 * Cut an epoch's pot (plus whatever rolled in) into 217 shares and pay only
 * the owned ones.
 */
export function settle(pot: bigint, carried: bigint, ownedHexes: number): Settlement {
  const total = pot + carried;
  const perHex = total / BigInt(HEX_COUNT);
  const owned = BigInt(Math.max(0, Math.min(HEX_COUNT, Math.floor(ownedHexes))));
  const paid = perHex * owned;
  return { perHex, paid, rolled: total - paid };
}

/** What a clan is owed for the epoch. */
export function clanEpochIncome(perHex: bigint, hexes: number): bigint {
  return perHex * BigInt(Math.max(0, Math.floor(hexes)));
}

/**
 * What one seat is owed, held for the whole epoch.
 *
 * Note what is not an argument here: the wallet's balance. That omission is
 * the design.
 */
export function seatIncome(clanIncome: bigint, filledSeats: number): bigint {
  const seats = Math.max(0, Math.floor(filledSeats));
  return seats === 0 ? 0n : clanIncome / BigInt(seats);
}

/**
 * Pro-rated for a seat held part of the epoch. Seconds, not a snapshot at the
 * bell — a seat taken at 23:59 is paid for one minute of it.
 */
export function seatIncomeForSeconds(
  clanIncome: bigint,
  totalSeatSeconds: number,
  heldSeconds: number,
): bigint {
  if (totalSeatSeconds <= 0) return 0n;
  const held = BigInt(Math.max(0, Math.floor(heldSeconds)));
  return (clanIncome * held) / BigInt(Math.floor(totalSeatSeconds));
}

/**
 * The comparison the site argues, both sides computed rather than asserted.
 *
 * Token-weighted: fees follow the balance, so a wallet with 4% of supply takes
 * 4% of every fee for ever, asleep. Seat-equal: fees follow ground, a wallet
 * is paid per seat it occupies, and the balance above one stake per seat is
 * worth nothing.
 */
export function tokenWeightedIncome(pot: bigint, balance: bigint): bigint {
  return (pot * balance) / SUPPLY;
}

export function fiftyIncome(
  perHex: bigint,
  clanHexes: number,
  clanSeats: number,
  seatsOccupied: number,
): bigint {
  const income = clanEpochIncome(perHex, clanHexes);
  return seatIncome(income, clanSeats) * BigInt(Math.max(0, Math.floor(seatsOccupied)));
}

/**
 * Seats a balance can occupy: one stake each, and never more than a clan has.
 * The floor is the gate — a balance of a hundred stakes still occupies fifty
 * seats at most, and only by finding fifty separate wallets to sit in them.
 */
export function seatsAffordable(balance: bigint): number {
  return Number(balance / SEAT_STAKE);
}

/**
 * The ceiling on any single actor: hexes one clan may hold, over the board.
 * Everything about how big a whale can get in this game is this fraction and
 * how many clans they are willing to run.
 */
export function clanCeilingBps(): number {
  return Math.floor((Math.floor(SEATS_PER_CLAN / 2) * 10_000) / HEX_COUNT);
}

/* ---------- formatting ---------- */

export function formatEth(wei: bigint, dp = 3): string {
  const neg = wei < 0n;
  const v = neg ? -wei : wei;
  const whole = v / WAD;
  const frac = ((v % WAD) * 10n ** BigInt(dp)) / WAD;
  const s = `${whole.toLocaleString("en-US")}.${frac.toString().padStart(dp, "0")}`;
  return neg ? `-${s}` : s;
}

export function formatTokens(wei: bigint): string {
  const whole = wei / WAD;
  if (whole >= 1_000_000_000n)
    return `${(Number(whole) / 1_000_000_000).toFixed(whole % 1_000_000_000n === 0n ? 0 : 1)}B`;
  if (whole >= 1_000_000n)
    return `${(Number(whole) / 1_000_000).toFixed(whole >= 10_000_000n ? 0 : 1)}M`;
  if (whole >= 1_000n) return `${(Number(whole) / 1_000).toFixed(0)}K`;
  return whole.toLocaleString("en-US");
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

export { WAD };
