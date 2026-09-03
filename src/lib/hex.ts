/**
 * The board.
 *
 * 217 flat-top hexes, radius 8 from the centre, axial coordinates. Everything
 * downstream — the sim, the map, the fronts — addresses a hex by its index in
 * `hexes`, which is stable because the generation order is fixed.
 *
 * Flat-top rather than pointy-top on purpose: a flat-top grid packs into
 * vertical columns, and vertical columns give the map a left-to-right reading
 * order that matches the way the clan table beside it is read. Pointy-top
 * grids read as honeycomb, which is decoration.
 */

export const MAP_RADIUS = 8;

export type Hex = {
  /** Index in `hexes`. The only id used anywhere else. */
  id: number;
  q: number;
  r: number;
  /** Rings out from the centre. 0 at the middle, 8 at the rim. */
  ring: number;
};

function key(q: number, r: number): number {
  // Packed into one number so lookups are a plain Map<number, number> rather
  // than string concatenation on every neighbour probe — the sim calls this
  // a few hundred thousand times.
  return (q + 32) * 64 + (r + 32);
}

function build(): { list: Hex[]; index: Map<number, number> } {
  const list: Hex[] = [];
  const index = new Map<number, number>();
  for (let q = -MAP_RADIUS; q <= MAP_RADIUS; q++) {
    const rMin = Math.max(-MAP_RADIUS, -q - MAP_RADIUS);
    const rMax = Math.min(MAP_RADIUS, -q + MAP_RADIUS);
    for (let r = rMin; r <= rMax; r++) {
      const id = list.length;
      list.push({ id, q, r, ring: (Math.abs(q) + Math.abs(r) + Math.abs(-q - r)) / 2 });
      index.set(key(q, r), id);
    }
  }
  return { list, index };
}

const built = build();

export const hexes: readonly Hex[] = built.list;
export const HEX_COUNT = built.list.length; // 217

export function hexAt(q: number, r: number): number | null {
  const id = built.index.get(key(q, r));
  return id === undefined ? null : id;
}

/** Axial directions, clockwise from due east. */
const DIRECTIONS: readonly [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

function buildNeighbours(): readonly (readonly number[])[] {
  return built.list.map((h) => {
    const out: number[] = [];
    for (const [dq, dr] of DIRECTIONS) {
      const n = hexAt(h.q + dq, h.r + dr);
      if (n !== null) out.push(n);
    }
    return out;
  });
}

/** Precomputed adjacency. Rim hexes have fewer than six. */
export const neighbours = buildNeighbours();

export function distance(a: Hex, b: Hex): number {
  return (
    (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2
  );
}

/**
 * Hex centre in pixels for a flat-top layout of the given size (centre to
 * corner). The board is centred on (0, 0); the caller translates.
 */
export function centre(h: Hex, size: number): { x: number; y: number } {
  return {
    x: size * 1.5 * h.q,
    y: size * Math.sqrt(3) * (h.r + h.q / 2),
  };
}

/** The six corners of a flat-top hex, clockwise from due east. */
export function corners(cx: number, cy: number, size: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    out.push([cx + size * Math.cos(a), cy + size * Math.sin(a)]);
  }
  return out;
}

/**
 * The shared edge between a hex and the neighbour in direction `dir`, as the
 * two corner indices that bound it.
 *
 * The two sequences run opposite ways and it is worth writing down why.
 * Corners are at 0°, 60°, … 300°, so on a canvas — where y points down — they
 * advance clockwise. The axial directions, projected through
 * `y = √3·(r + q/2)`, land at 30°, −30°, −90°, −150°, 150°, 90°, which is
 * counter-clockwise. So direction d is the edge between corners (6−d) and
 * (7−d), not (d) and (d+1). Get this wrong and every border on the map is
 * drawn one facet round: still a plausible-looking map, and wrong everywhere.
 */
export function edgeCorners(dir: number): [number, number] {
  return [(6 - dir) % 6, (7 - dir) % 6];
}

/** The neighbour of `id` in direction `dir`, or null off the board. */
export function neighbourInDirection(id: number, dir: number): number | null {
  const h = built.list[id];
  const [dq, dr] = DIRECTIONS[dir];
  return hexAt(h.q + dq, h.r + dr);
}

/** Direction index from a hex to an adjacent one, or -1 if they do not touch. */
export function directionTo(a: Hex, b: Hex): number {
  return DIRECTIONS.findIndex(([dq, dr]) => a.q + dq === b.q && a.r + dr === b.r);
}

/** The board's bounding box at a given hex size, for fitting it to a canvas. */
export function boardExtent(size: number): { width: number; height: number } {
  const w = size * (1.5 * MAP_RADIUS * 2 + 2);
  const h = size * Math.sqrt(3) * (MAP_RADIUS * 2 + 1);
  return { width: w, height: h };
}
