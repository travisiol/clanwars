export const siteConfig = {
  // Placeholder name — not final. The brief called this "Clan Wars", which is
  // a mode of Clash of Clans and therefore not a brand anyone can own. FIFTY
  // names the cap instead, which is the actual mechanic.
  //
  // `name` is the all-caps lockup (metadata, nav, OG image); `wordmark` is the
  // title-case form the hero sets; `ticker` is derived from it. Nothing else on
  // the site spells the name out, so a rename is these three strings plus the
  // env prefix below.
  name: "FIFTY",
  wordmark: "Fifty",
  ticker: "$FIFTY",
  tagline: "Fifty seats. One banner. One border.",
  description:
    "Holders sit in clans of fifty. Clans hold ground, ground pays the fees, and a clan takes ground by voting for it in the open — twelve hours before the blow lands.",
  seoDescription:
    "An on-chain territory game where power is counted in seats, not tokens. Fifty members to a clan, 217 hexes, every fee split by ground held, and every war declared twelve hours before it resolves.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://fifty.example",
  x: process.env.NEXT_PUBLIC_FIFTY_X ?? null,
  telegram: process.env.NEXT_PUBLIC_FIFTY_TELEGRAM ?? null,
} as const;

function envOrNull(value: string | undefined): string | null {
  return value && value.trim().length > 0 ? value : null;
}

/**
 * The token and the game.
 *
 * Two addresses on purpose, and the site has to be able to say which of the
 * two is standing. A token can trade for a week before a map contract is
 * wired to its fee hook, and during that week the honest thing to show is a
 * token with no game attached — not a countdown to nothing.
 *
 * Both are env-driven so no placeholder address ships hardcoded. With either
 * unset, every action surface sits disabled with the reason on the control.
 */
export const contracts = {
  tokenAddress: envOrNull(
    process.env.NEXT_PUBLIC_FIFTY_TOKEN_ADDRESS,
  ) as `0x${string}` | null,
  /** Clans, seats, the map and the vote all live in one module. */
  mapAddress: envOrNull(
    process.env.NEXT_PUBLIC_FIFTY_MAP_ADDRESS,
  ) as `0x${string}` | null,
  /** Where the fee is collected. Excluded from every count of seats. */
  poolAddress: envOrNull(process.env.NEXT_PUBLIC_FIFTY_POOL_ADDRESS) as
    | `0x${string}`
    | null,
  isLive: process.env.NEXT_PUBLIC_FIFTY_LIVE === "true",
} as const;

/** The token exists and can be read. */
export const tokenIsLive = contracts.isLive && contracts.tokenAddress !== null;

/** The map actually runs, which needs the game module and a pool behind it. */
export const mapIsLive =
  tokenIsLive && contracts.mapAddress !== null && contracts.poolAddress !== null;

export const nav = [
  { href: "#map", label: "The map" },
  { href: "#war", label: "War" },
  { href: "#seat", label: "The seat" },
  { href: "#clans", label: "Clans" },
  { href: "#faq", label: "FAQ" },
] as const;
