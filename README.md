# FIFTY

**Fifty seats. One banner. One border.**

An on-chain territory game where power is counted in seats, not tokens.
Holders sit in clans of fifty; clans hold hexes; hexes pay the trading fees;
and a clan takes ground by voting for it in the open, twelve hours before the
blow lands.

The brief called this "Clan Wars". That is a mode of *Clash of Clans* and not
a brand anyone can own, so the working name is **FIFTY** — the cap is the
mechanic. It lives in three strings in `src/lib/site-config.ts` (`name`,
`wordmark`, `ticker`) plus the `NEXT_PUBLIC_FIFTY_*` env prefix, and nothing
else on the site spells it out. Renaming is those three strings and the
prefix. The folder on disk is `clanwars`; that is not the name.

```bash
npm install
npm run dev      # http://localhost:3216
npm run check    # replays the rules and the arithmetic the site argues
npm run build
```

## The rules, in full

Five constants and one comparison. They live in `src/lib/rules.ts` and
`src/lib/economics.ts`, and every figure printed on the site is derived from
them — there are no hand-typed numbers on the page.

| | |
| --- | --- |
| Supply | 1B tokens, fixed, no mint |
| Trading fee | 2% buy, 2% sell |
| To clans | 100%. Nothing is skimmed. |
| Stake per seat | 500,000 tokens (0.05% of supply) |
| Seats per clan | 50 |
| Seats per hex | 2 — so a full clan holds 25 |
| Board | 217 hexes, radius 8, all paying an equal share |
| Ceiling for one clan | 11.52% of the fees |
| Epoch | 24 hours — seats refresh, fees settle, dig-in ticks |
| War vote | 12 hours, open to both sides |
| Dig-in | 1 point per epoch held, capped at 12 |
| Tie | holds for the defender |

**Earning.** Each epoch's fees are cut into 217 equal shares, one per hex.
Shares belonging to hexes nobody owns are not paid — they roll into the next
epoch and never expire. A clan's take is split equally between its filled
seats, pro rata to the seconds each seat was held.

**Fighting.** Any member can put an adjacent enemy hex to the vote. The vote
stands open for twelve hours and both sides can read it. Attack is the number
of seats that voted yes; defence is the hex's dig-in plus every defending seat
that answered the muster. Strictly greater takes it.

## The three decisions that carry the design

**A seat pays a seat.** Fees reach a wallet through the seat it occupies, and
every seat in a clan is paid the same. Buying more of the token earns *nothing*
— not less than proportionally, nothing. `src/components/Seat.tsx` draws this
as a step function against the token-weighted line, and marks the balance where
the two cross (about 4.6 stakes at the simulated season's volume): past that
point every token bought is dead weight. The crossing is computed from the same
pot and stake the rest of the page uses, so it cannot drift into flattering the
argument.

This does not keep a whale out and the site says so. Fifty wallets and 2.5% of
supply buys a clan. What the cap does is convert capital into obligation: fifty
wallets that each have to be somewhere at a particular hour.

**The attack is announced.** A surprise attack is settled by who happened to be
awake. An announced one is settled by who can get their clan out of bed — which
is the retention mechanic, and the reason the vote is the most prominent object
on the page. Twelve hours is chosen to cover any single timezone's night.

**Every hex pays the same.** No tiers, no golden centre. The moment some ground
pays more, the game is about buying the good ground and the good ground goes to
whoever has the most money. What differs between two hexes is who is standing
on the other side of them — which is why the only heavy line on the map is the
front.

## The shape of the site

One screen, no scroll on desktop: the board fills it, the pitch sits beside it,
and everything else opens over the top and closes back to the map. Pick a hex
and a sheet slides in from the right with that hex's clan, its garrison, what
it costs to take, and the vote if there is one. The explanation lives in an
overlay with four tabs rather than below a fold that does not exist. On a
phone the map takes the top of the screen and the page scrolls like a page —
cramming both into one portrait screen means either a map too small to read or
copy printed over it.

The skin is PLOTLAND's: deep navy ground, heavy uppercase display with a gold
keyline, mono for every number. Two reservations carry the map. **Colour means
claimed** — an unowned hex is a hairline on the void and takes a banner's
colour only when somebody is standing on it. **Gold means a vote is open** —
one hex, one halo, and before a single vote is open there is no gold on the map
at all. What is drawn heaviest after that is the front, in chalk, because
every hex pays the same and the only thing that makes ground interesting is
who is on the other side of it.

## What is on the page and where it comes from

Nothing is deployed. The board is a 74-epoch season played by these exact
functions in `src/lib/sim.ts`, deterministic from one seed, and it is labelled
as simulated wherever it is drawn. It is not decoration: the clan table's
closing sentence — that the three quietest clans lost 18 hexes and the three
loudest lost 4 — is computed from the run, not written down. Change a rule and
the sentence changes with it.

`src/lib/board.ts` is the single shape every component reads. Today its source
is the simulation; the day an indexer exists it becomes the source and no
component changes, because there is no second, untested code path for the live
case to fall down.

## `npm run check`

1,222 assertions, each corresponding to a sentence on the site: the tie holding
for the defender with no margin, the dig-in cap, the seats needed to break a
garrison, settlement conserving value with unowned shares rolling forward,
income being independent of balance, the ceiling arithmetic, and the front
geometry — both sides of every drawn border really being different clans, which
is what catches an off-by-one in the direction-to-corner mapping that would
otherwise produce a plausible-looking map with every border one facet round.

## Open decisions

None of these are faked anywhere on the site; the FAQ carries the first two.

1. **What funds the build.** The fee is 100% to clans and 0% to a protocol,
   which is in the headline and therefore has to be literally true. There is no
   revenue line anywhere in these rules. A treasury allocation, a share of the
   fee, or a separate raise all change a number on the page.
2. **The regulatory reading.** A locked stake paying a share of trading fees is
   exactly the shape lawyers argue about. It has not been through counsel in
   any jurisdiction.
3. **Supply and distribution at launch.** 1B fixed is assumed. Who holds it on
   day one is not decided, and with 600 seats across twelve clans, 30% of
   supply would be locked in stakes at full occupancy — that number needs a
   deliberate answer, not a default.
4. **Founding a clan.** Anyone may raise a banner in these rules and nothing
   costs them anything to try. A junk-clan flood is survivable (a two-seat clan
   has a maximum defence of 14 and gets eaten) but it is untidy; a founding
   cost or a minimum roster is worth considering.
5. **Where the fee is collected.** Robinhood Chain specifics — which pool, which
   hook — are unverified. `src/lib/chain.ts` documents what was gathered from
   third-party sources and what must be re-checked.
6. **Whether a clan can hold past capacity.** Today it simply cannot claim or
   take a 26th hex. The alternative — taking it and having your weakest holding
   revert to grass — keeps the late game moving but adds a sixth rule.

## Notes

- Fonts load from a runtime `<link>` rather than `next/font/google`, which
  downloads at build time and needs outbound access from wherever the build
  runs.
- The dev server is on port 3216; 3100, 3210, 3212 and 3214 are taken by
  sibling projects on this machine.
- The twelve banner colours deliberately avoid the yellow-orange band. A clan
  the colour of gold would look like it was permanently on fire.
