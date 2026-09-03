"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/Label";
import { board } from "@/lib/board";
import { formatEth, formatBps } from "@/lib/economics";
import { HEX_COUNT } from "@/lib/hex";
import { DUG_IN_CAP, MUSTER_HOURS, SEATS_PER_CLAN, holdCapacity } from "@/lib/rules";
import { siteConfig } from "@/lib/site-config";
import { useUi, type InfoTab } from "@/lib/ui-state";

/*
 * The whole product in one list, behind a single control.
 *
 * Every row carries its real state beside it. A menu that quietly omits what
 * has not happened yet tells a visitor nothing about where this is going, so
 * "0 deployed" is a row rather than an absence.
 */
export function Drawer() {
  const [open, setOpen] = useState(false);
  const { openInfo } = useUi();
  const b = board();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const groups: { title: string; items: { label: string; tab: InfoTab; note: string }[] }[] = [
    {
      title: "The board",
      items: [
        { label: "How it works", tab: "how", note: "6 steps" },
        { label: "Clans", tab: "clans", note: String(b.clans.length) },
        {
          label: "Ground held",
          tab: "clans",
          note: `${b.ownedHexes} / ${HEX_COUNT}`,
        },
      ],
    },
    {
      title: "The money",
      items: [
        { label: "What a seat pays", tab: "seat", note: `${formatEth(b.perHex / 2n, 4)} ETH` },
        { label: "The ceiling", tab: "seat", note: formatBps(1152) },
        { label: "Fee split", tab: "questions", note: "100% to clans" },
      ],
    },
    {
      title: "Reference",
      items: [
        { label: "Questions", tab: "questions", note: "15" },
        { label: "Token", tab: "questions", note: siteConfig.ticker },
        { label: "Contracts", tab: "questions", note: "0 deployed" },
      ],
    },
  ];

  const go = (tab: InfoTab) => {
    setOpen(false);
    openInfo(tab);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] border border-rule transition-colors duration-150 hover:border-gold"
      >
        {[0, 1, 2].map((bar) => (
          <span key={bar} aria-hidden className="h-px w-4 bg-chalk" />
        ))}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="flex-1 bg-void/80"
          />
          <nav className="w-[320px] max-w-[86vw] overflow-y-auto border-l border-rule bg-field">
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <Label className="text-chalk">{siteConfig.name}</Label>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="type-data px-2 text-chalk-muted transition-colors duration-150 hover:text-gold"
              >
                ✕
              </button>
            </div>

            {groups.map((group) => (
              <div key={group.title} className="border-b border-rule px-5 py-4">
                <Label>{group.title}</Label>
                <ul className="mt-3 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => go(item.tab)}
                        className="group flex w-full items-baseline justify-between gap-3 py-1.5 text-left"
                      >
                        <span className="type-body text-chalk-soft transition-colors duration-150 group-hover:text-gold">
                          {item.label}
                        </span>
                        <span className="type-data shrink-0 text-chalk-muted">{item.note}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="px-5 py-5">
              <Label>The rule, in one line</Label>
              <p className="type-body mt-2 text-chalk-soft">
                {SEATS_PER_CLAN} seats to a clan, two seats hold one hex, so a full clan holds{" "}
                {holdCapacity(SEATS_PER_CLAN)} of {HEX_COUNT}. An attack is voted in the open for{" "}
                {MUSTER_HOURS} hours; attack is the yes votes, defence is up to {DUG_IN_CAP} for
                holding the ground plus every seat that answers. A tie holds for the defender.
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
