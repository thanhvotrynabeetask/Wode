export interface Point {
  x: number;
  y: number;
}

export interface RouterNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RouteRequest {
  key: string;
  fromId: string;
  toId: string;
  labelWidth: number;
  /** Interior bend points chosen by the user. When present the edge is routed manually. */
  waypoints?: Point[];
}

export interface RoutedEdge {
  points: Point[];
  labelX: number;
  labelY: number;
  isManual: boolean;
}

export interface RouterBounds {
  minX: number;
  width: number;
  height: number;
}

/** Routing grid resolution in px. Every vertical track and port sits on this grid. */
const GRID = 10;
/** Clearance kept between a route and any node it is not attached to. */
const NODE_PADDING = 10;
/** Straight horizontal run kept at both ends so arrowheads always point straight into a node. */
export const PORT_STUB = 14;

const TURN_COST = 5;
const OVERLAP_COST = 14;
const CROSSING_COST = 2.5;
const PREFERRED_COLUMN_BIAS = 0.03;

const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

const snap = (v: number) => Math.round(v / GRID) * GRID;

class MinHeap {
  private f: number[] = [];
  private s: number[] = [];

  get size() {
    return this.f.length;
  }

  push(priority: number, state: number) {
    let i = this.f.length;
    this.f.push(priority);
    this.s.push(state);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.f[parent] <= priority) break;
      this.f[i] = this.f[parent];
      this.s[i] = this.s[parent];
      i = parent;
    }
    this.f[i] = priority;
    this.s[i] = state;
  }

  pop(): number {
    const top = this.s[0];
    const lastF = this.f.pop() as number;
    const lastS = this.s.pop() as number;
    const n = this.f.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        let child = 2 * i + 1;
        if (child >= n) break;
        if (child + 1 < n && this.f[child + 1] < this.f[child]) child++;
        if (this.f[child] >= lastF) break;
        this.f[i] = this.f[child];
        this.s[i] = this.s[child];
        i = child;
      }
      this.f[i] = lastF;
      this.s[i] = lastS;
    }
    return top;
  }
}

/** Removes duplicate and collinear points so a polyline only keeps its real corners. */
export function simplifyPolyline(points: Point[]): Point[] {
  const deduped: Point[] = [];
  points.forEach((p) => {
    const last = deduped[deduped.length - 1];
    if (!last || Math.abs(last.x - p.x) > 0.01 || Math.abs(last.y - p.y) > 0.01) {
      deduped.push({ x: p.x, y: p.y });
    }
  });

  const result: Point[] = [];
  deduped.forEach((p) => {
    while (result.length >= 2) {
      const a = result[result.length - 2];
      const b = result[result.length - 1];
      const sameX = Math.abs(a.x - b.x) < 0.01 && Math.abs(b.x - p.x) < 0.01;
      const sameY = Math.abs(a.y - b.y) < 0.01 && Math.abs(b.y - p.y) < 0.01;
      if (sameX || sameY) result.pop();
      else break;
    }
    result.push(p);
  });
  return result;
}

/** Turns a polyline into an SVG path with softly rounded corners. */
export function pointsToPath(points: Point[], radius = 8): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    const lenIn = Math.hypot(cur.x - prev.x, cur.y - prev.y);
    const lenOut = Math.hypot(next.x - cur.x, next.y - cur.y);
    const r = Math.min(radius, lenIn / 2, lenOut / 2);
    if (r < 0.5) {
      d += ` L ${cur.x} ${cur.y}`;
      continue;
    }
    const ax = cur.x - ((cur.x - prev.x) / lenIn) * r;
    const ay = cur.y - ((cur.y - prev.y) / lenIn) * r;
    const bx = cur.x + ((next.x - cur.x) / lenOut) * r;
    const by = cur.y + ((next.y - cur.y) / lenOut) * r;
    d += ` L ${ax} ${ay} Q ${cur.x} ${cur.y} ${bx} ${by}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Forces user waypoints into a valid orthogonal route between the two ports:
 * horizontal out of the source, alternating vertical/horizontal, horizontal into the target.
 */
export function buildManualPoints(start: Point, end: Point, waypoints: Point[]): Point[] | null {
  if (waypoints.length === 0 || waypoints.length % 2 !== 0) return null;
  const pts: Point[] = [start, ...waypoints.map((w) => ({ x: w.x, y: w.y })), end];
  const k = waypoints.length;

  for (let j = 0; j < k; j++) {
    if (j % 2 === 0) pts[j + 1].y = pts[j].y;
    else pts[j + 1].x = pts[j].x;
  }
  pts[k].y = end.y;

  if (k >= 2) {
    const minX = start.x + PORT_STUB;
    if (pts[1].x < minX) {
      pts[1].x = minX;
      pts[2].x = minX;
    }
    const maxX = end.x - PORT_STUB;
    if (pts[k].x > maxX) {
      pts[k - 1].x = maxX;
      pts[k].x = maxX;
    }
  }
  return simplifyPolyline(pts);
}

/** Converts an edited polyline back into the interior bend points that get persisted. */
export function extractWaypoints(points: Point[]): Point[] {
  return simplifyPolyline(points)
    .slice(1, -1)
    .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

interface PortAssignment {
  out: Map<string, number>;
  in: Map<string, number>;
}

function spreadPortOffsets(count: number): number[] {
  if (count === 1) return [0];
  if (count <= 3) return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * GRID * 2);
  return Array.from({ length: count }, (_, i) => (i - Math.floor((count - 1) / 2)) * GRID);
}

function assignPorts(requests: RouteRequest[], nodeById: Map<string, RouterNode>): PortAssignment {
  const result: PortAssignment = { out: new Map(), in: new Map() };
  const centerY = (n: RouterNode) => n.y + n.height / 2;

  const allocate = (side: 'out' | 'in') => {
    const groups = new Map<string, RouteRequest[]>();
    requests.forEach((r) => {
      const ownerId = side === 'out' ? r.fromId : r.toId;
      if (!groups.has(ownerId)) groups.set(ownerId, []);
      groups.get(ownerId)!.push(r);
    });

    groups.forEach((group, ownerId) => {
      const owner = nodeById.get(ownerId)!;
      const counterpart = (r: RouteRequest) => nodeById.get(side === 'out' ? r.toId : r.fromId)!;
      // Sorting by where the other end sits keeps the fan of lines from crossing itself.
      group.sort((a, b) => {
        const na = counterpart(a);
        const nb = counterpart(b);
        return centerY(na) - centerY(nb) || na.x - nb.x;
      });
      const base = snap(centerY(owner));
      const offsets = spreadPortOffsets(group.length);
      group.forEach((r, i) => {
        result[side].set(r.key, base + offsets[i]);
      });
    });
  };

  allocate('out');
  allocate('in');
  return result;
}

interface Grid {
  cols: number;
  rows: number;
  blocked: Uint8Array;
  occH: Uint8Array;
  occV: Uint8Array;
}

function buildGrid(nodes: RouterNode[], bounds: RouterBounds): Grid {
  const cols = Math.ceil(bounds.width / GRID) + 4;
  const rows = Math.ceil(bounds.height / GRID) + 4;
  const blocked = new Uint8Array(cols * rows);

  const block = (c: number, r: number) => {
    if (c >= 0 && c < cols && r >= 0 && r < rows) blocked[r * cols + c] = 1;
  };

  for (let c = 0; c < cols; c++) {
    block(c, 0);
    block(c, rows - 1);
  }
  for (let r = 0; r < rows; r++) {
    block(0, r);
    block(cols - 1, r);
    for (let c = 0; c * GRID < bounds.minX; c++) block(c, r);
  }

  nodes.forEach((n) => {
    const c0 = Math.ceil((n.x - NODE_PADDING) / GRID);
    const c1 = Math.floor((n.x + n.width + NODE_PADDING) / GRID);
    const r0 = Math.ceil((n.y - NODE_PADDING) / GRID);
    const r1 = Math.floor((n.y + n.height + NODE_PADDING) / GRID);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) block(c, r);
  });

  return { cols, rows, blocked, occH: new Uint8Array(cols * rows), occV: new Uint8Array(cols * rows) };
}

interface Window {
  c0: number;
  c1: number;
  r0: number;
  r1: number;
}

function searchCells(
  grid: Grid,
  start: { c: number; r: number },
  goal: { c: number; r: number },
  preferredCol: number,
  win: Window
): { c: number; r: number }[] | null {
  const W = win.c1 - win.c0 + 1;
  const H = win.r1 - win.r0 + 1;
  const total = W * H * 4;
  const g = new Float32Array(total).fill(Infinity);
  const parent = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const heap = new MinHeap();

  const stateOf = (c: number, r: number, d: number) => ((r - win.r0) * W + (c - win.c0)) * 4 + d;
  const heuristic = (c: number, r: number) => Math.abs(c - goal.c) + Math.abs(r - goal.r);

  const startState = stateOf(start.c, start.r, 0);
  g[startState] = 0;
  heap.push(heuristic(start.c, start.r), startState);

  while (heap.size > 0) {
    const state = heap.pop();
    if (closed[state]) continue;
    closed[state] = 1;

    const d = state % 4;
    const cellIdx = (state - d) / 4;
    const c = (cellIdx % W) + win.c0;
    const r = Math.floor(cellIdx / W) + win.r0;

    if (c === goal.c && r === goal.r && d !== 2) {
      const cells: { c: number; r: number }[] = [];
      let cur = state;
      while (cur !== -1) {
        const cd = cur % 4;
        const ci = (cur - cd) / 4;
        cells.push({ c: (ci % W) + win.c0, r: Math.floor(ci / W) + win.r0 });
        cur = parent[cur];
      }
      return cells.reverse();
    }

    for (let nd = 0; nd < 4; nd++) {
      if (nd === (d + 2) % 4) continue;
      const nc = c + DX[nd];
      const nr = r + DY[nd];
      if (nc < win.c0 || nc > win.c1 || nr < win.r0 || nr > win.r1) continue;
      const gridIdx = nr * grid.cols + nc;
      if (grid.blocked[gridIdx]) continue;

      const horizontal = nd % 2 === 0;
      let cost = 1;
      if (nd !== d) cost += TURN_COST;
      cost += horizontal
        ? grid.occH[gridIdx] * OVERLAP_COST + grid.occV[gridIdx] * CROSSING_COST
        : grid.occV[gridIdx] * OVERLAP_COST + grid.occH[gridIdx] * CROSSING_COST;
      if (!horizontal) cost += PREFERRED_COLUMN_BIAS * Math.abs(nc - preferredCol);

      const ns = stateOf(nc, nr, nd);
      const ng = g[state] + cost;
      if (ng < g[ns]) {
        g[ns] = ng;
        parent[ns] = state;
        heap.push(ng + heuristic(nc, nr), ns);
      }
    }
  }
  return null;
}

function registerOccupancy(grid: Grid, cells: { c: number; r: number }[]) {
  for (let i = 0; i < cells.length - 1; i++) {
    const a = cells[i];
    const b = cells[i + 1];
    const target = a.r === b.r ? grid.occH : grid.occV;
    target[a.r * grid.cols + a.c] = Math.min(250, target[a.r * grid.cols + a.c] + 1);
    target[b.r * grid.cols + b.c] = Math.min(250, target[b.r * grid.cols + b.c] + 1);
  }
}

function registerPolylineOccupancy(grid: Grid, points: Point[]) {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const horizontal = Math.abs(a.y - b.y) < 0.01;
    const target = horizontal ? grid.occH : grid.occV;
    if (horizontal) {
      const r = Math.round(a.y / GRID);
      const from = Math.round(Math.min(a.x, b.x) / GRID);
      const to = Math.round(Math.max(a.x, b.x) / GRID);
      for (let c = from; c <= to; c++) {
        if (c >= 0 && c < grid.cols && r >= 0 && r < grid.rows) target[r * grid.cols + c] += 1;
      }
    } else {
      const c = Math.round(a.x / GRID);
      const from = Math.round(Math.min(a.y, b.y) / GRID);
      const to = Math.round(Math.max(a.y, b.y) / GRID);
      for (let r = from; r <= to; r++) {
        if (c >= 0 && c < grid.cols && r >= 0 && r < grid.rows) target[r * grid.cols + c] += 1;
      }
    }
  }
}

function routeAutomatically(
  grid: Grid,
  start: Point,
  end: Point
): Point[] {
  const sc = Math.ceil((start.x + PORT_STUB) / GRID);
  const sr = Math.round(start.y / GRID);
  const ec = Math.floor((end.x - PORT_STUB) / GRID);
  const er = Math.round(end.y / GRID);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const startCell = { c: clamp(sc, 1, grid.cols - 2), r: clamp(sr, 1, grid.rows - 2) };
  const goalCell = { c: clamp(ec, 1, grid.cols - 2), r: clamp(er, 1, grid.rows - 2) };

  // The two end cells sit just outside their own node, but a tight gap could still flag them.
  const startIdx = startCell.r * grid.cols + startCell.c;
  const goalIdx = goalCell.r * grid.cols + goalCell.c;
  const startWasBlocked = grid.blocked[startIdx];
  const goalWasBlocked = grid.blocked[goalIdx];
  grid.blocked[startIdx] = 0;
  grid.blocked[goalIdx] = 0;

  const preferredCol = Math.round((startCell.c + goalCell.c) / 2);
  const margin = { c: 30, r: 20 };
  const local: Window = {
    c0: Math.max(0, Math.min(startCell.c, goalCell.c) - margin.c),
    c1: Math.min(grid.cols - 1, Math.max(startCell.c, goalCell.c) + margin.c),
    r0: Math.max(0, Math.min(startCell.r, goalCell.r) - margin.r),
    r1: Math.min(grid.rows - 1, Math.max(startCell.r, goalCell.r) + margin.r),
  };
  const full: Window = { c0: 0, c1: grid.cols - 1, r0: 0, r1: grid.rows - 1 };

  const cells =
    searchCells(grid, startCell, goalCell, preferredCol, local) ||
    searchCells(grid, startCell, goalCell, preferredCol, full);

  grid.blocked[startIdx] = startWasBlocked;
  grid.blocked[goalIdx] = goalWasBlocked;

  let body: Point[];
  if (cells) {
    registerOccupancy(grid, cells);
    body = cells.map((cell) => ({ x: cell.c * GRID, y: cell.r * GRID }));
  } else {
    const midX = snap((startCell.c * GRID + goalCell.c * GRID) / 2);
    body = [
      { x: startCell.c * GRID, y: startCell.r * GRID },
      { x: midX, y: startCell.r * GRID },
      { x: midX, y: goalCell.r * GRID },
      { x: goalCell.c * GRID, y: goalCell.r * GRID },
    ];
  }

  return simplifyPolyline([start, ...body, end]);
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const rectsOverlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function placeLabel(
  points: Point[],
  labelWidth: number,
  obstacles: Rect[],
  placed: Rect[]
): { x: number; y: number } {
  const halfW = labelWidth / 2;
  const pillRect = (x: number, y: number): Rect => ({ x: x - halfW, y: y - 10, w: labelWidth, h: 20 });

  const candidates: { x: number; y: number; length: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const horizontal = Math.abs(a.y - b.y) < 0.01;
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if (horizontal && length >= labelWidth + 24) {
      const minX = Math.min(a.x, b.x);
      [0.5, 0.3, 0.7].forEach((t) => candidates.push({ x: minX + length * t, y: a.y, length }));
    } else if (!horizontal) {
      candidates.push({ x: a.x, y: (a.y + b.y) / 2, length: length / 2 });
    }
  }
  candidates.sort((p, q) => q.length - p.length);

  if (candidates.length === 0) {
    const a = points[0];
    const b = points[points.length - 1];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  const free = candidates.find((cand) => {
    const rect = pillRect(cand.x, cand.y);
    return !obstacles.some((o) => rectsOverlap(rect, o)) && !placed.some((p) => rectsOverlap(rect, p));
  });
  return free || candidates[0];
}

/**
 * Routes every edge orthogonally around nodes. Ports on a node side are spread apart,
 * parallel runs are pushed onto separate tracks, and a user-defined route always wins over auto routing.
 */
export function routeEdges(
  nodes: RouterNode[],
  requests: RouteRequest[],
  bounds: RouterBounds
): Map<string, RoutedEdge> {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const valid = requests.filter(
    (r) => r.fromId !== r.toId && nodeById.has(r.fromId) && nodeById.has(r.toId)
  );

  const ports = assignPorts(valid, nodeById);
  const grid = buildGrid(nodes, bounds);
  const routes = new Map<string, { points: Point[]; isManual: boolean }>();

  const endpoints = (r: RouteRequest) => {
    const from = nodeById.get(r.fromId)!;
    const to = nodeById.get(r.toId)!;
    return {
      start: { x: from.x + from.width, y: ports.out.get(r.key)! },
      end: { x: to.x, y: ports.in.get(r.key)! },
    };
  };

  // User routes are laid down first so automatic routes flow around them.
  valid.forEach((r) => {
    if (!r.waypoints || r.waypoints.length === 0) return;
    const { start, end } = endpoints(r);
    const manual = buildManualPoints(start, end, r.waypoints);
    if (!manual) return;
    registerPolylineOccupancy(grid, manual);
    routes.set(r.key, { points: manual, isManual: true });
  });

  valid
    .filter((r) => !routes.has(r.key))
    .map((r) => {
      const { start, end } = endpoints(r);
      return { r, start, end, span: Math.abs(end.x - start.x) + Math.abs(end.y - start.y) };
    })
    .sort((a, b) => a.span - b.span)
    .forEach(({ r, start, end }) => {
      routes.set(r.key, { points: routeAutomatically(grid, start, end), isManual: false });
    });

  const obstacles: Rect[] = nodes.map((n) => ({ x: n.x, y: n.y, w: n.width, h: n.height }));
  const placedLabels: Rect[] = [];
  const result = new Map<string, RoutedEdge>();

  valid.forEach((r) => {
    const route = routes.get(r.key);
    if (!route) return;
    const label = r.labelWidth > 0 ? placeLabel(route.points, r.labelWidth, obstacles, placedLabels) : null;
    const labelPoint = label || route.points[Math.floor(route.points.length / 2)];
    if (label) {
      placedLabels.push({ x: label.x - r.labelWidth / 2, y: label.y - 10, w: r.labelWidth, h: 20 });
    }
    result.set(r.key, {
      points: route.points,
      labelX: labelPoint.x,
      labelY: labelPoint.y,
      isManual: route.isManual,
    });
  });

  return result;
}
