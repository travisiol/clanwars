"use client";

/**
 * The map, printed.
 *
 * Flat ink on paper. No bevel, no height, no glow — every hex on this board
 * pays the same, so a tile drawn as an object would be making a claim the
 * rules do not support. What is drawn heavy is the FRONT: the edge where two
 * clans touch, which is the only thing on the board that decides anything.
 *
 * Two readings of the same plate, because the map has two questions and they
 * do not fit in one drawing:
 *
 *   HOLD  — who owns what. Full ink, tags at each territory's centroid.
 *   FRONT — where the fighting is. Every interior hex drops to a wash and
 *           only the contested rim keeps its ink, so the map resolves into
 *           the shape of its borders.
 *
 * Canvas note, learned the hard way on a sibling project: never write
 * `canvas.style.width` in pixels. It pins the element to whatever the last
 * redraw measured, and redraws run on rAF, which stops in a background tab —
 * so a nominally full-width canvas ends up several hundred pixels wide on a
 * phone. Size the backing store only; CSS owns the element.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HEX_COUNT,
  centre,
  corners,
  edgeCorners,
  hexAt,
  hexes,
  neighbourInDirection,
  neighbours,
} from "@/lib/hex";
import { INK, INK_MUTE, PAPER, PAPER_DEEP, PAPER_LIT, WAR, inkOf, inkWash } from "@/lib/inks";
import type { Board } from "@/lib/board";

export type MapMode = "hold" | "front";

const DIR_KEYS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

function hexRound(qf: number, rf: number): [number, number] {
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return [q, r];
}

export function MapPlate({
  board,
  mode,
  active,
  onActive,
  className,
}: {
  board: Board;
  mode: MapMode;
  /** The hex under the pointer or the keyboard cursor, or null. */
  active: number | null;
  onActive: (hex: number | null) => void;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  /**
   * The edges a vote is actually being fought over: those of the defended hex
   * that face the attacking clan. Keyed by the unordered pair of hexes, since
   * a front is stored once from each side and only one of the two is drawn.
   */
  const warEdges = useMemo(() => {
    const s = new Set<string>();
    for (const w of board.wars) {
      for (const n of neighbours[w.hex]) {
        if (board.owner[n] !== w.attacker) continue;
        s.add(`${Math.min(w.hex, n)}:${Math.max(w.hex, n)}`);
      }
    }
    return s;
  }, [board.wars, board.owner]);

  /** Hexes that touch another clan. In FRONT mode these are the only ink. */
  const contested = useMemo(() => {
    const s = new Set<number>();
    for (const f of board.fronts) s.add(f.hex);
    return s;
  }, [board.fronts]);

  /** One label per territory, at its centre of mass. */
  const tags = useMemo(() => {
    const acc = new Map<number, { q: number; r: number; n: number }>();
    for (let i = 0; i < HEX_COUNT; i++) {
      const o = board.owner[i];
      if (o === -1) continue;
      const a = acc.get(o) ?? { q: 0, r: 0, n: 0 };
      a.q += hexes[i].q;
      a.r += hexes[i].r;
      a.n += 1;
      acc.set(o, a);
    }
    return [...acc.entries()].map(([clan, a]) => {
      // Snap the centroid onto a hex the clan actually owns, so a horseshoe
      // territory never gets labelled in the hole in the middle of it.
      const target = { q: a.q / a.n, r: a.r / a.n };
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < HEX_COUNT; i++) {
        if (board.owner[i] !== clan) continue;
        const d = (hexes[i].q - target.q) ** 2 + (hexes[i].r - target.r) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return { clan, hex: best };
    });
  }, [board.owner]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setBox({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /** Board units are hex-size multiples; this is the fit for the current box. */
  const view = useMemo(() => {
    // Extent measured from the real centres rather than a formula, so a change
    // to the layout cannot silently crop the rim.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const h of hexes) {
      const c = centre(h, 1);
      minX = Math.min(minX, c.x - 1);
      maxX = Math.max(maxX, c.x + 1);
      minY = Math.min(minY, c.y - 0.87);
      maxY = Math.max(maxY, c.y + 0.87);
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const pad = 0.06;
    const size = Math.min(box.w / (w * (1 + pad)), box.h / (h * (1 + pad)));
    return {
      size,
      ox: box.w / 2 - ((minX + maxX) / 2) * size,
      oy: box.h / 2 - ((minY + maxY) / 2) * size,
    };
  }, [box]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || box.w === 0 || box.h === 0 || view.size <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(box.w * dpr)) canvas.width = Math.round(box.w * dpr);
    if (canvas.height !== Math.round(box.h * dpr)) canvas.height = Math.round(box.h * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);

    const { size, ox, oy } = view;
    const at = (i: number) => {
      const c = centre(hexes[i], size);
      return { x: c.x + ox, y: c.y + oy };
    };
    // `trace` adds a hex to the current path; `path` starts a new one with it.
    // Kept apart because the neutral hatch clips against all of them at once,
    // and a beginPath() inside that loop would clip to the last hex only.
    const trace = (i: number) => {
      const c = at(i);
      const pts = corners(c.x, c.y, size);
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < 6; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
    };
    const path = (i: number) => {
      ctx.beginPath();
      trace(i);
    };

    const activeClan = active !== null ? board.owner[active] : -1;

    /* 1. The plate. */
    for (let i = 0; i < HEX_COUNT; i++) {
      const owner = board.owner[i];
      path(i);
      if (owner === -1) {
        ctx.fillStyle = PAPER_DEEP;
      } else if (mode === "hold") {
        ctx.fillStyle = inkWash(owner, activeClan === -1 || activeClan === owner ? 1 : 0.82);
      } else {
        ctx.fillStyle = inkWash(owner, contested.has(i) ? 0.72 : 0.12);
      }
      ctx.fill();
      // A hairline of paper between tiles: printed plates never touch.
      ctx.lineWidth = 1;
      ctx.strokeStyle = owner === -1 ? "rgba(26,29,36,0.10)" : "rgba(247,244,236,0.55)";
      ctx.stroke();
    }

    /* 2. Neutral ground, hatched. Grass, not a clan with a pale colour. */
    ctx.save();
    ctx.beginPath();
    ctx.beginPath();
    for (let i = 0; i < HEX_COUNT; i++) if (board.owner[i] === -1) trace(i);
    ctx.clip();
    ctx.strokeStyle = "rgba(26,29,36,0.16)";
    ctx.lineWidth = 1;
    const step = Math.max(4, size * 0.42);
    for (let x = -box.h; x < box.w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + box.h, box.h);
      ctx.stroke();
    }
    ctx.restore();

    /* 3. The fronts. The only heavy line on the plate. */
    ctx.lineCap = "round";
    for (const f of board.fronts) {
      // Each border is in the list twice, once from each side. Draw the lower
      // clan id only, or every front gets painted twice and reads bolder than
      // a front on the rim of the board.
      if (f.own > f.other) continue;
      const c = at(f.hex);
      const pts = corners(c.x, c.y, size);
      const [a, b] = edgeCorners(f.dir);
      const across = neighbourInDirection(f.hex, f.dir);
      const hot =
        across !== null &&
        warEdges.has(`${Math.min(f.hex, across)}:${Math.max(f.hex, across)}`);
      ctx.strokeStyle = hot ? WAR : INK;
      ctx.lineWidth = hot ? Math.max(3, size * 0.26) : Math.max(1.8, size * 0.15);
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    }

    /* 4. The whole territory the reader is pointing into.
       Outlined rather than isolated by dimming everything else: a map that
       washes out on every pointer move stops being a printed plate and starts
       being a web app, and the reader loses the shape they were reading. */
    if (activeClan !== -1) {
      ctx.beginPath();
      for (let i = 0; i < HEX_COUNT; i++) {
        if (board.owner[i] !== activeClan) continue;
        const c = at(i);
        const pts = corners(c.x, c.y, size);
        for (let d = 0; d < 6; d++) {
          const n = neighbourInDirection(i, d);
          if (n !== null && board.owner[n] === activeClan) continue;
          const [a, b2] = edgeCorners(d);
          ctx.moveTo(pts[a][0], pts[a][1]);
          ctx.lineTo(pts[b2][0], pts[b2][1]);
        }
      }
      ctx.strokeStyle = PAPER_LIT;
      ctx.lineWidth = Math.max(4, size * 0.3);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.8, size * 0.15);
      ctx.stroke();
    }

    /* 5. Whatever the reader is pointing at. */
    if (active !== null) {
      path(active);
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2, size * 0.14);
      ctx.stroke();
      path(active);
      ctx.strokeStyle = PAPER_LIT;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* 6. Hexes with a vote open on them. */
    for (const w of board.wars) {
      const c = at(w.hex);
      ctx.strokeStyle = WAR;
      ctx.lineWidth = Math.max(1.6, size * 0.12);
      ctx.beginPath();
      ctx.arc(c.x, c.y, size * 0.42, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* 7. Territory tags. */
    if (size > 9) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.max(9, Math.round(size * 0.62))}px "Space Mono", ui-monospace, monospace`;
      for (const t of tags) {
        const c = at(t.hex);
        const dim = mode === "front" || (activeClan !== -1 && activeClan !== t.clan);
        ctx.fillStyle = dim ? "rgba(247,244,236,0.55)" : PAPER_LIT;
        if (mode === "front" && !contested.has(t.hex)) ctx.fillStyle = inkOf(t.clan);
        ctx.fillText(board.clans.find((c2) => c2.id === t.clan)?.tag ?? "", c.x, c.y + 0.5);
      }
    }
  }, [active, board, box, contested, mode, tags, view, warEdges]);

  useEffect(() => {
    draw();
  }, [draw]);

  const hexUnder = useCallback(
    (clientX: number, clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas || view.size <= 0) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - view.ox;
      const y = clientY - rect.top - view.oy;
      const qf = ((2 / 3) * x) / view.size;
      const rf = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / view.size;
      const [q, r] = hexRound(qf, rf);
      return hexAt(q, r);
    },
    [view],
  );

  return (
    <div ref={wrapRef} className={className}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="Board of 217 hexes. Arrow keys move between hexes; the reading appears beside the map."
        className="block h-full w-full cursor-crosshair focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        onPointerMove={(e) => onActive(hexUnder(e.clientX, e.clientY))}
        onPointerLeave={() => onActive(null)}
        onKeyDown={(e) => {
          const step = DIR_KEYS[e.key];
          if (!step) return;
          e.preventDefault();
          const from = active === null ? 108 : active;
          const next = hexAt(hexes[from].q + step[0], hexes[from].r + step[1]);
          onActive(next ?? from);
        }}
        onFocus={() => {
          if (active === null) onActive(108);
        }}
      />
    </div>
  );
}

export { PAPER, INK_MUTE };
