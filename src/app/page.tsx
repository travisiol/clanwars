import { Faq } from "@/components/Faq";
import { Ledger } from "@/components/Ledger";
import { MapStage } from "@/components/MapStage";
import { Roster, RosterKey } from "@/components/Roster";
import { Seat } from "@/components/Seat";
import { Steps } from "@/components/Steps";
import { WarCard, WarSheet } from "@/components/WarSheet";
import { WalletConnect } from "@/components/WalletConnect";
import { Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import { formatEth } from "@/lib/economics";
import { HEX_COUNT } from "@/lib/hex";
import { SEATS_PER_CLAN, holdCapacity } from "@/lib/rules";
import { mapIsLive, siteConfig } from "@/lib/site-config";

const shell = "mx-auto w-full max-w-[1180px] px-4 sm:px-6";

function SectionHead({
  label,
  title,
  lede,
  id,
}: {
  label: string;
  title: string;
  lede?: React.ReactNode;
  id?: string;
}) {
  return (
    <header id={id} className="scroll-mt-24">
      <Label>{label}</Label>
      <h2 className="type-head mt-3 max-w-[22ch] text-ink">{title}</h2>
      {lede && <p className="type-sub mt-4 max-w-[62ch] text-ink-soft">{lede}</p>}
    </header>
  );
}

function Reading({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{k}</Label>
      <span className="type-figure text-ink">{v}</span>
      {hint && <span className="type-data text-ink-mute">{hint}</span>}
    </div>
  );
}

export default function Home() {
  const b = board();
  const seatsOpen = b.clans.length * SEATS_PER_CLAN - b.totalSeats;
  const biggest = b.clans[0];

  return (
    <div id="top">
      {/* ---------------------------------------------------------------- */}
      <section className={`${shell} pt-10 pb-14 sm:pt-16`}>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-14">
          <div className="rise">
            <Label>
              {HEX_COUNT} hexes · {b.clans.length} clans · {SEATS_PER_CLAN} seats to a clan
            </Label>
            <h1 className="type-display mt-5 text-ink">{siteConfig.tagline}</h1>
            <p className="type-sub mt-6 max-w-[54ch] text-ink-soft">{siteConfig.description}</p>

            <div className="mt-8 flex flex-wrap items-start gap-3">
              <WalletConnect
                className="px-5 py-3"
                wrapperClassName="max-w-[280px]"
                showHint={!mapIsLive}
              />
              <a
                href="#war"
                className="type-label inline-flex items-center justify-center rounded-full px-5 py-3 text-ink ring-1 ring-rule-strong ring-inset transition-colors hover:bg-ink hover:text-paper-lit"
              >
                Watch a war
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-rule pt-6 sm:grid-cols-4">
              <Reading k="Fees, today" v={`${formatEth(b.pot, 2)} ETH`} hint="2% each side" />
              <Reading
                k="One hex pays"
                v={formatEth(b.perHex, 4)}
                hint={`all ${HEX_COUNT} the same`}
              />
              <Reading
                k="A seat takes"
                v={formatEth(b.perHex / 2n, 4)}
                hint="clan at capacity"
              />
              <Reading k="Seats open" v={`${seatsOpen}`} hint={`of ${b.clans.length * SEATS_PER_CLAN}`} />
            </div>
          </div>

          {b.wars[0] && (
            <div className="rise" style={{ animationDelay: "90ms" }}>
              <WarCard w={b.wars[0]} compact />
              <p className="type-data mt-3 text-ink-mute">
                Every attack is public while it is still a vote. That is the game: the
                defender always has half a day, and half a day is exactly long enough
                to wake fifty people up.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className={`${shell} border-t border-rule py-14`}>
        <SectionHead
          id="map"
          label="The board"
          title="Two hundred and seventeen hexes, all worth the same."
          lede={
            <>
              There are no tiers here and no golden centre. Every hex pays one equal
              share of the day&apos;s fees, so the only thing that makes a piece of
              ground interesting is who is standing on the other side of it. Switch
              to <span className="text-ink">Fronts</span> and the map turns into the
              shape it is actually played on.
            </>
          }
        />
        <div className="mt-9">
          <MapStage />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className={`${shell} border-t border-rule py-14`}>
        <Steps />
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className={`${shell} border-t border-rule py-14`}>
        <SectionHead
          id="war"
          label="War"
          title="Declared twelve hours before it lands."
          lede={
            <>
              A clan votes in the open, and the vote is the siren. Both sides watch the
              same two bars fill for half a day: the attacker gathering seats, the
              defender waking people up. Nothing is hidden and nothing is random — the
              hex goes to whichever side got more of its fifty to answer.
            </>
          }
        />
        <div className="mt-6">
          <RosterKey ink={null} />
        </div>
        <div className="mt-6">
          <WarSheet />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className={`${shell} border-t border-rule py-14`}>
        <SectionHead
          id="seat"
          label="The seat"
          title="Buying more of the token earns you nothing."
          lede={
            <>
              Fees reach a wallet through the seat it occupies, and every seat in a clan
              is paid the same. Not weighted, not curved — the same. Here is what that
              does to a wallet that keeps buying.
            </>
          }
        />
        <div className="mt-9">
          <Seat />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className={`${shell} border-t border-rule py-14`}>
        <SectionHead
          id="clans"
          label="Clans"
          title="Twelve banners, and only enough ground for eight."
          lede={
            <>
              A full clan holds {holdCapacity(SEATS_PER_CLAN)} hexes and there are {HEX_COUNT} of
              them, so the board fits eight clans and a half. That shortfall is the
              engine: somebody is always hungry, and the clan that stops answering is
              the one they eat.
            </>
          }
        />

        <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12">
          <div className="order-2 min-w-0 lg:order-1">
            <Ledger />
          </div>
          <aside className="order-1 lg:order-2 lg:pt-1">
            <div className="sheet p-5">
              <Label>Biggest roster — {biggest.name}</Label>
              <div className="mt-4">
                <Roster
                  ink={biggest.ink}
                  filled={biggest.seats}
                  cell={14}
                  label={`${biggest.name}: ${biggest.seats} of ${SEATS_PER_CLAN} seats taken`}
                />
              </div>
              <p className="type-body mt-4 text-ink-soft">
                {biggest.seats} of {SEATS_PER_CLAN} taken, holding {biggest.hexes} hexes.
                Its {Math.round(biggest.discipline * 100)}% turnout is why it still has
                them.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className={`${shell} border-t border-rule py-14`}>
        <SectionHead id="faq" label="The rules, and the gaps in them" title="Straight answers, including the two that are still open." />
        <div className="mt-9">
          <Faq />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <footer className={`${shell} border-t border-rule py-10`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="type-head text-ink">{siteConfig.wordmark}</p>
            <p className="type-data mt-2 max-w-[52ch] text-ink-mute">
              {siteConfig.ticker} on Robinhood Chain. Nothing is deployed yet: the board
              on this page is a season played by these rules, not a season anybody
              played. No addresses, no allocation, no date.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {siteConfig.x && (
              <a className="type-label text-ink-mute hover:text-ink" href={siteConfig.x}>
                X
              </a>
            )}
            {siteConfig.telegram && (
              <a className="type-label text-ink-mute hover:text-ink" href={siteConfig.telegram}>
                Telegram
              </a>
            )}
            <a className="type-label text-ink-mute hover:text-ink" href="#top">
              Back to the top
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
