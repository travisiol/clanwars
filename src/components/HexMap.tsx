"use client";

/**
 * The board, full bleed, on the void.
 *
 * The map is the product, so it gets the whole screen and everything else
 * opens on top of it. Two rules do all the work here:
 *
 *   Colour means claimed. An unowned hex is a hairline on the void. It only
 *   takes a banner's colour when somebody is standing on it.
 *
 *   Gold means a vote is open. One hex, one halo, and it is the first thing
 *   the eye lands on — correctly, because it is the only object on the board
 *   with a deadline.
 *
 * What is drawn heaviest after that is the FRONT: the edge where two clans
 * touch, in chalk. Not the tiles. Every hex on this board pays the same, so
 * a tile drawn as a precious object would be making a claim the rules do not
 * support; the only thing that makes a piece of ground interesting is who is
 * standing on the other side of it.
 *
 * Canvas note, learned the hard way on a sibling project: never write
 * `canvas.style.width` in pixels. It pins the element to whatever the last
 * redraw measured, and redraws run on rAF, which stops in a background tab —
 * so a nominally full-width canvas ends up hundreds of pixels wide on a
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
import {
  CHALK,
  CHALK_SOFT,
  FIELD_LINE,
  GOLD,
  GOLD_BRIGHT,
  inkWash,
  rgba,
} from "@/lib/inks";
import type { Board } from "@/lib/board";

export type MapMode = "hold" | "front";

const DIR_KEYS: Record<string, [number, number]> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** A fixed starfield. Seeded so it never twitches between redraws. */
const STARS = (() => {
  let seed = 20260903;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: 190 }, () => ({
    x: rand(),
    y: rand(),
    r: 0.4 + rand() * 1.1,
    a: 0.16 + rand() * 0.5,
  }));
})();

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

export function HexMap({
  board,
  mode,
  active,
  onActive,
  onPick,
  /** Where the board's centre sits, as a fraction of the canvas. */
  bias = 0.5,
  biasY = 0.5,
  className,
}: {
  board: Board;
  mode: MapMode;
  active: number | null;
  onActive: (hex: number | null) => void;
  onPick: (hex: number) => void;
  bias?: number;
  biasY?: number;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pulse, setPulse] = useState(0);

  const warHexes = useMemo(() => new Set(board.wars.map((w) => w.hex)), [board.wars]);

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

  /** Hexes that touch another clan. In FRONT mode these are the only colour. */
  const contested = useMemo(() => {
    const s = new Set<number>();
    for (const f of board.fronts) s.add(f.hex);
    return s;
  }, [board.fronts]);

  /** One label per territory, snapped to a hex the clan actually owns. */
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
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /* The halo on an open vote breathes. Nothing else on the board moves. */
  useEffect(() => {
    if (board.wars.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      setPulse(performance.now() / 1000);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : ((stopped = false), start()));
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [board.wars.length]);

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
    // Fitted to the smaller half of the canvas so the board never runs under
    // the pitch: at bias 0.66 the map owns the right two thirds and has to fit
    // in what is left of the width from its own centre outwards.
    const room = Math.min(bias, 1 - bias) * 2;
    const size = Math.min((box.w * room) / (w * 1.06), (box.h * 0.94) / h);
    return {
      size,
      ox: box.w * bias - ((minX + maxX) / 2) * size,
      oy: box.h * biasY - ((minY + maxY) / 2) * size,
    };
  }, [box, bias, biasY]);

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

    /* 1. Space. */
    for (const star of STARS) {
      ctx.beginPath();
      ctx.arc(star.x * box.w, star.y * box.h, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(198, 224, 240, ${star.a})`;
      ctx.fill();
    }

    /* 2. A soft field under the board so it sits on something. */
    const glow = ctx.createRadialGradient(
      box.w * bias,
      box.h * biasY,
      size * 2,
      box.w * bias,
      box.h * biasY,
      size * 20,
    );
    glow.addColorStop(0, "rgba(31, 82, 140, 0.34)");
    glow.addColorStop(0.55, "rgba(21, 55, 96, 0.16)");
    glow.addColorStop(1, "rgba(8, 20, 38, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, box.w, box.h);

    const activeClan = active !== null ? board.owner[active] : -1;

    /* 3. The tiles. Colour only where somebody is standing. */
    for (let i = 0; i < HEX_COUNT; i++) {
      const owner = board.owner[i];
      path(i);
      if (owner === -1) {
        ctx.fillStyle = "rgba(13, 32, 57, 0.55)";
        ctx.fill();
        ctx.strokeStyle = FIELD_LINE;
        ctx.lineWidth = 1;
        ctx.stroke();
        continue;
      }
      const quiet = mode === "front" && !contested.has(i);
      const dim = activeClan !== -1 && activeClan !== owner;
      ctx.fillStyle = inkWash(owner, quiet ? 0.1 : dim ? 0.3 : 0.44);
      ctx.fill();
      ctx.strokeStyle = inkWash(owner, quiet ? 0.28 : dim ? 0.5 : 0.85);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* 4. The fronts. The heaviest line on the board after the vote. */
    ctx.lineCap = "round";
    for (const f of board.fronts) {
      // Each border is in the list twice, once from each side. Draw the lower
      // clan id only, or a front gets painted twice and reads bolder than a
      // front on the rim of the board.
      if (f.own > f.other) continue;
      const c = at(f.hex);
      const pts = corners(c.x, c.y, size);
      const [a, b] = edgeCorners(f.dir);
      const across = neighbourInDirection(f.hex, f.dir);
      const hot =
        across !== null && warEdges.has(`${Math.min(f.hex, across)}:${Math.max(f.hex, across)}`);
      ctx.strokeStyle = hot ? GOLD_BRIGHT : rgba(CHALK, mode === "front" ? 0.6 : 0.42);
      ctx.lineWidth = hot ? Math.max(3, size * 0.26) : Math.max(1.4, size * 0.12);
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    }

    /* 5. The territory under the pointer, outlined rather than isolated.
       A board that washes out on every pointer move stops being a map, and
       the outline answers a question dimming never did: where ELSE is this
       clan, which for a scattered holding is the interesting half. */
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
      ctx.strokeStyle = rgba(CHALK, 0.9);
      ctx.lineWidth = Math.max(1.6, size * 0.14);
      ctx.stroke();
    }

    /* 6. Hexes with a vote open on them: a halo, then the ring. */
    const breath = 0.72 + 0.28 * Math.sin(pulse * 1.6);
    for (const w of board.wars) {
      const c = at(w.hex);
      const spot = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, size * 4.6);
      spot.addColorStop(0, `rgba(242, 167, 27, ${0.34 * breath})`);
      spot.addColorStop(0.45, `rgba(242, 167, 27, ${0.12 * breath})`);
      spot.addColorStop(1, "rgba(242, 167, 27, 0)");
      ctx.fillStyle = spot;
      ctx.fillRect(c.x - size * 5, c.y - size * 5, size * 10, size * 10);

      path(w.hex);
      ctx.fillStyle = `rgba(242, 167, 27, ${0.2 + 0.12 * breath})`;
      ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = Math.max(2, size * 0.18);
      ctx.stroke();
    }

    /* 7. Whatever the reader is pointing at. */
    if (active !== null) {
      path(active);
      ctx.strokeStyle = CHALK;
      ctx.lineWidth = Math.max(2, size * 0.16);
      ctx.stroke();
    }

    /* 8. Territory tags. */
    if (size > 10) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${Math.max(9, Math.round(size * 0.56))}px "IBM Plex Mono", ui-monospace, monospace`;
      for (const t of tags) {
        const c = at(t.hex);
        const dim = activeClan !== -1 && activeClan !== t.clan;
        ctx.fillStyle = dim ? rgba(CHALK_SOFT, 0.4) : rgba(CHALK, 0.92);
        ctx.fillText(board.clans.find((c2) => c2.id === t.clan)?.tag ?? "", c.x, c.y + 0.5);
      }
    }
  }, [active, bias, biasY, board, box, contested, mode, pulse, tags, view, warEdges]);

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

  const hovering = active !== null;

  return (
    <div ref={wrapRef} className={className}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label={`Board of ${HEX_COUNT} hexes. Arrow keys move between hexes, Enter opens one.${
          warHexes.size > 0 ? ` ${warHexes.size} have a war vote open.` : ""
        }`}
        className={`block h-full w-full ${hovering ? "cursor-pointer" : "cursor-crosshair"}`}
        onPointerMove={(e) => onActive(hexUnder(e.clientX, e.clientY))}
        onPointerLeave={() => onActive(null)}
        onClick={(e) => {
          const id = hexUnder(e.clientX, e.clientY);
          if (id !== null) onPick(id);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (active !== null) {
              e.preventDefault();
              onPick(active);
            }
            return;
          }
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
