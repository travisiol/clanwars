"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * What is open, in one place.
 *
 * The site is a single screen: the board, with sheets and an overlay on top
 * of it. The header lives in the layout and the board lives in the page, so
 * "open the explanation" has to be shared state rather than a prop — and
 * keeping it here means there is exactly one answer to "what is the visitor
 * looking at", which is the whole reason this site has no scroll.
 */
export type InfoTab = "how" | "seat" | "clans" | "questions";

type Ui = {
  /** The hex whose sheet is open, or null. */
  picked: number | null;
  pick: (hex: number | null) => void;
  infoTab: InfoTab | null;
  openInfo: (tab: InfoTab) => void;
  closeInfo: () => void;
};

const UiContext = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [infoTab, setInfoTab] = useState<InfoTab | null>(null);

  const pick = useCallback((hex: number | null) => setPicked(hex), []);
  const openInfo = useCallback((tab: InfoTab) => setInfoTab(tab), []);
  const closeInfo = useCallback(() => setInfoTab(null), []);

  const value = useMemo(
    () => ({ picked, pick, infoTab, openInfo, closeInfo }),
    [picked, pick, infoTab, openInfo, closeInfo],
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): Ui {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}
