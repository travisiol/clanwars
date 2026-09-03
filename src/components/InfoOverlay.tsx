"use client";

import { useEffect } from "react";
import { Faq } from "@/components/Faq";
import { HowItWorks } from "@/components/HowItWorks";
import { Ledger } from "@/components/Ledger";
import { Seat } from "@/components/Seat";
import { Awaiting } from "@/components/ui/Label";
import { useUi, type InfoTab } from "@/lib/ui-state";

/*
 * Everything that is not the board, behind one control.
 *
 * The site is a single screen, so the explanation cannot live below a fold
 * that does not exist. It opens over the map instead, in tabs, and closes
 * back to it — which keeps the board as the only thing a visitor has to
 * understand on arrival.
 */
const tabs = [
  { id: "how", label: "How to play", Panel: HowItWorks },
  { id: "seat", label: "How you earn", Panel: Seat },
  { id: "clans", label: "Clans", Panel: Ledger },
  { id: "questions", label: "Questions", Panel: Faq },
] as const;

/*
 * Which tab is open lives in the shared UI state rather than here, so that
 * "open the questions" from the drawer and "switch to the questions" from the
 * tab strip are the same action. A local copy synced from a prop would be a
 * second source of truth for one boolean-ish thing, and the sync would have
 * to run in an effect.
 */
export function InfoOverlay({
  initialTab = "how",
  onClose,
}: {
  initialTab?: InfoTab;
  onClose: () => void;
}) {
  const { openInfo } = useUi();
  const active = initialTab;
  const Panel = tabs.find((tab) => tab.id === active)?.Panel ?? HowItWorks;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-void/97 backdrop-blur-sm lg:absolute">
      <div className="flex items-center justify-between gap-4 border-b border-rule px-4 sm:px-6">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => openInfo(tab.id)}
                className={`type-label whitespace-nowrap border-b-2 px-3 py-4 transition-colors duration-150 ${
                  active === tab.id
                    ? "border-gold text-gold"
                    : "border-transparent text-chalk-soft hover:text-chalk"
                }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="type-label shrink-0 border border-rule px-3 py-2 text-chalk-muted transition-colors duration-150 hover:border-gold hover:text-gold"
        >
          Back to the board
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
          <Panel />
        </div>
        <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 sm:px-6">
          <Awaiting>Awaiting launch — no contracts are live yet</Awaiting>
        </div>
      </div>
    </div>
  );
}
