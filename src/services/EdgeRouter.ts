import { BorderSide, NodeBorderAnchor } from '../types/schema';

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
  sourceAnchor?: NodeBorderAnchor;
  targetAnchor?: NodeBorderAnchor;
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

/** Max offset threshold (in px) under which an edge connecting two nodes is snapped into a pure straight line. */
export const STRAIGHT_ALIGN_TOLERANCE = 18;

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

/**
 * Detects if a polyline represents a connection between two nodes that are intended
 * to be straight (vertically or horizontally aligned within tolerance) and snaps
 * it into a single clean 2-point line, eliminating crooked bends and S-curves.
 */
export function straightenAlignedPolyline(points: Point[], tolerance = STRAIGHT_ALIGN_TOLERANCE): Point[] {
  if (points.length <= 2) return points;
  const start = points[0];
  const end = points[points.length - 1];

  // Vertical alignment check: all points stay within tolerance of the straight line
  const isAllVertical = points.every(
    (p) => Math.abs(p.x - start.x) <= tolerance && Math.abs(p.x - end.x) <= tolerance
  );
  if (isAllVertical && Math.abs(start.y - end.y) > 15) {
    const alignX = Math.round((start.x + end.x) / 2);
    return [{ x: alignX, y: start.y }, { x: alignX, y: end.y }];
  }

  // Horizontal alignment check: all points stay within tolerance of the straight line
  const isAllHorizontal = points.every(
    (p) => Math.abs(p.y - start.y) <= tolerance && Math.abs(p.y - end.y) <= tolerance
  );
  if (isAllHorizontal && Math.abs(start.x - end.x) > 15) {
    const alignY = Math.round((start.y + end.y) / 2);
    return [{ x: start.x, y: alignY }, { x: end.x, y: alignY }];
  }

  return points;
}

/**
 * Smartly infers the most natural connection sides between two nodes when not explicitly configured.
 * If nodes are stacked vertically (e.g., across swimlanes) and aligned horizontally, it uses bottom->top.
 */
export function inferDefaultBorderSides(
  fromNode: { x: number; y: number; width: number; height: number },
  toNode: { x: number; y: number; width: number; height: number }
): { sourceSide: BorderSide; targetSide: BorderSide } {
  const fromCenterX = fromNode.x + fromNode.width / 2;
  const fromCenterY = fromNode.y + fromNode.height / 2;
  const toCenterX = toNode.x + toNode.width / 2;
  const toCenterY = toNode.y + toNode.height / 2;

  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  const maxNodeWidth = Math.max(fromNode.width, toNode.width);
  // Vertically stacked if horizontal center distance is within 70% of node width and vertical gap is significant
  const isVerticallyStacked = Math.abs(dx) <= maxNodeWidth * 0.75;

  if (isVerticallyStacked && Math.abs(dy) >= 30) {
    if (dy > 0) {
      return { sourceSide: 'bottom', targetSide: 'top' };
    } else {
      return { sourceSide: 'top', targetSide: 'bottom' };
    }
  }

  // Standard horizontal left-to-right or right-to-left
  if (dx >= 0) {
    return { sourceSide: 'right', targetSide: 'left' };
  } else {
    return { sourceSide: 'left', targetSide: 'right' };
  }
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

export function getPortStubPoint(p: Point, side: BorderSide, dist: number = PORT_STUB): Point {
  switch (side) {
    case 'right': return { x: p.x + dist, y: p.y };
    case 'left': return { x: p.x - dist, y: p.y };
    case 'top': return { x: p.x, y: p.y - dist };
    case 'bottom': return { x: p.x, y: p.y + dist };
  }
}

/**
 * Calculates the exact port point on one of the 4 sides of a node.
 * If totalCount === 1: sits exactly in the center/middle of that side.
 * If totalCount > 1: evenly spaces the ports along the side, symmetrically centered around the middle.
 */
export function getNodeSidePort(
  node: { x: number; y: number; width: number; height: number },
  side: BorderSide,
  index: number = 0,
  totalCount: number = 1
): Point {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;

  if (totalCount <= 1) {
    switch (side) {
      case 'top':
        return { x: Math.round(centerX), y: Math.round(node.y) };
      case 'bottom':
        return { x: Math.round(centerX), y: Math.round(node.y + node.height) };
      case 'left':
        return { x: Math.round(node.x), y: Math.round(centerY) };
      case 'right':
      default:
        return { x: Math.round(node.x + node.width), y: Math.round(centerY) };
    }
  }

  // Multi-edge distribution: evenly spaced, centered in the middle of the side
  const isHorizontal = side === 'top' || side === 'bottom';
  const totalLength = isHorizontal ? node.width : node.height;
  const margin = Math.min(12, totalLength * 0.1);
  const availableLength = Math.max(10, totalLength - 2 * margin);
  const maxSpacing = 20;
  const spacing = Math.min(maxSpacing, availableLength / (totalCount - 1));
  const offset = (index - (totalCount - 1) / 2) * spacing;

  switch (side) {
    case 'top':
      return { x: Math.round(centerX + offset), y: Math.round(node.y) };
    case 'bottom':
      return { x: Math.round(centerX + offset), y: Math.round(node.y + node.height) };
    case 'left':
      return { x: Math.round(node.x), y: Math.round(centerY + offset) };
    case 'right':
    default:
      return { x: Math.round(node.x + node.width), y: Math.round(centerY + offset) };
  }
}

/**
 * Calculates absolute coordinates of a border anchor point on a node.
 * Strictly anchored to the center of the specified side.
 */
export function anchorToPoint(
  node: { x: number; y: number; width: number; height: number },
  anchor?: NodeBorderAnchor
): Point {
  return getNodeSidePort(node, anchor?.side || 'right', 0, 1);
}

/**
 * Determines which of the 4 border sides ('top' | 'right' | 'bottom' | 'left')
 * a given point is closest to relative to the node.
 */
export function pointToBorderSide(
  node: { x: number; y: number; width: number; height: number },
  point: Point
): BorderSide {
  const minX = node.x;
  const maxX = node.x + node.width;
  const minY = node.y;
  const maxY = node.y + node.height;

  // Clamped coordinates on the node bounding box
  const cx = Math.max(minX, Math.min(maxX, point.x));
  const cy = Math.max(minY, Math.min(maxY, point.y));

  // Distances to the 4 border segments
  const distLeft = Math.hypot(point.x - minX, point.y - cy);
  const distRight = Math.hypot(point.x - maxX, point.y - cy);
  const distTop = Math.hypot(point.x - cx, point.y - minY);
  const distBottom = Math.hypot(point.x - cx, point.y - maxY);

  const minDist = Math.min(distLeft, distRight, distTop, distBottom);

  if (minDist === distLeft) return 'left';
  if (minDist === distRight) return 'right';
  if (minDist === distTop) return 'top';
  return 'bottom';
}

/**
 * Maps any canvas point to one of the 4 border sides, locked to the middle (ratio 0.5).
 */
export function pointToBorderAnchor(
  node: { x: number; y: number; width: number; height: number },
  point: Point
): NodeBorderAnchor {
  return {
    side: pointToBorderSide(node, point),
    ratio: 0.5,
  };
}

/**
 * Computes the distributed port for a specific edge on a node, taking into account
 * other edges currently attached to that same side of the node.
 */
export function getNodePortForEdge(
  node: { x: number; y: number; width: number; height: number; instanceId?: string },
  side: BorderSide,
  currentEdgeId: string,
  counterpartNode: { x: number; y: number; width: number; height: number },
  allEdges: { id: string; fromInstanceId: string; toInstanceId: string; sourceAnchor?: NodeBorderAnchor; targetAnchor?: NodeBorderAnchor }[],
  allNodes: { instanceId: string; x: number; y: number; width: number; height: number }[]
): Point {
  const nodeInstId = node.instanceId;
  const nodeMap = new Map(allNodes.map((n) => [n.instanceId, n]));

  // Find all edges that attach to this node on this side
  const conns: { edgeId: string; otherX: number; otherY: number }[] = [];

  allEdges.forEach((e) => {
    if (e.id === currentEdgeId) return; // Will add with current counterpart below
    if (!nodeInstId) return;

    if (e.fromInstanceId === nodeInstId) {
      const eSide = e.sourceAnchor?.side || 'right';
      if (eSide === side) {
        const other = nodeMap.get(e.toInstanceId);
        conns.push({
          edgeId: e.id,
          otherX: other ? other.x + other.width / 2 : 0,
          otherY: other ? other.y + other.height / 2 : 0,
        });
      }
    } else if (e.toInstanceId === nodeInstId) {
      const eSide = e.targetAnchor?.side || 'left';
      if (eSide === side) {
        const other = nodeMap.get(e.fromInstanceId);
        conns.push({
          edgeId: e.id,
          otherX: other ? other.x + other.width / 2 : 0,
          otherY: other ? other.y + other.height / 2 : 0,
        });
      }
    }
  });

  // Add the current edge
  conns.push({
    edgeId: currentEdgeId,
    otherX: counterpartNode.x + counterpartNode.width / 2,
    otherY: counterpartNode.y + counterpartNode.height / 2,
  });

  // Sort along the edge to avoid line crossings
  if (side === 'left' || side === 'right') {
    conns.sort((a, b) => a.otherY - b.otherY || a.otherX - b.otherX || a.edgeId.localeCompare(b.edgeId));
  } else {
    conns.sort((a, b) => a.otherX - b.otherX || a.otherY - b.otherY || a.edgeId.localeCompare(b.edgeId));
  }

  const myIndex = Math.max(0, conns.findIndex((c) => c.edgeId === currentEdgeId));
  return getNodeSidePort(node, side, myIndex, conns.length);
}

/**
 * Constructs an orthogonal connector between any two border points with specified departure/arrival sides.
 */
export function buildOrthogonalConnector(
  start: Point,
  end: Point,
  startSide: BorderSide = 'right',
  endSide: BorderSide = 'left'
): Point[] {
  // 1. Direct Straight Vertical Check
  const isOpposingVertical =
    (startSide === 'bottom' && endSide === 'top' && start.y <= end.y) ||
    (startSide === 'top' && endSide === 'bottom' && start.y >= end.y);

  if (isOpposingVertical && Math.abs(start.x - end.x) <= STRAIGHT_ALIGN_TOLERANCE) {
    const alignX = Math.round((start.x + end.x) / 2);
    return [
      { x: alignX, y: start.y },
      { x: alignX, y: end.y },
    ];
  }

  // 2. Direct Straight Horizontal Check
  const isOpposingHorizontal =
    (startSide === 'right' && endSide === 'left' && start.x <= end.x) ||
    (startSide === 'left' && endSide === 'right' && start.x >= end.x);

  if (isOpposingHorizontal && Math.abs(start.y - end.y) <= STRAIGHT_ALIGN_TOLERANCE) {
    const alignY = Math.round((start.y + end.y) / 2);
    return [
      { x: start.x, y: alignY },
      { x: end.x, y: alignY },
    ];
  }

  const pStart = getPortStubPoint(start, startSide, PORT_STUB);
  const pEnd = getPortStubPoint(end, endSide, PORT_STUB);

  const isStartHorizontal = startSide === 'left' || startSide === 'right';
  const isEndHorizontal = endSide === 'left' || endSide === 'right';

  let pts: Point[];

  if (isStartHorizontal && isEndHorizontal) {
    if (startSide === 'right' && endSide === 'left' && pStart.x <= pEnd.x) {
      const midX = snap((pStart.x + pEnd.x) / 2);
      pts = [start, pStart, { x: midX, y: pStart.y }, { x: midX, y: pEnd.y }, pEnd, end];
    } else if (startSide === 'left' && endSide === 'right' && pStart.x >= pEnd.x) {
      const midX = snap((pStart.x + pEnd.x) / 2);
      pts = [start, pStart, { x: midX, y: pStart.y }, { x: midX, y: pEnd.y }, pEnd, end];
    } else {
      const midY = snap((pStart.y + pEnd.y) / 2);
      const escapeX = startSide === 'right' ? Math.max(pStart.x, pEnd.x) + 20 : Math.min(pStart.x, pEnd.x) - 20;
      pts = [start, pStart, { x: escapeX, y: pStart.y }, { x: escapeX, y: midY }, { x: pEnd.x, y: midY }, pEnd, end];
    }
  } else if (!isStartHorizontal && !isEndHorizontal) {
    if (startSide === 'bottom' && endSide === 'top' && pStart.y <= pEnd.y) {
      const midY = snap((pStart.y + pEnd.y) / 2);
      pts = [start, pStart, { x: pStart.x, y: midY }, { x: pEnd.x, y: midY }, pEnd, end];
    } else if (startSide === 'top' && endSide === 'bottom' && pStart.y >= pEnd.y) {
      const midY = snap((pStart.y + pEnd.y) / 2);
      pts = [start, pStart, { x: pStart.x, y: midY }, { x: pEnd.x, y: midY }, pEnd, end];
    } else {
      const midX = snap((pStart.x + pEnd.x) / 2);
      const escapeY = startSide === 'bottom' ? Math.max(pStart.y, pEnd.y) + 20 : Math.min(pStart.y, pEnd.y) - 20;
      pts = [start, pStart, { x: pStart.x, y: escapeY }, { x: midX, y: escapeY }, { x: midX, y: pEnd.y }, pEnd, end];
    }
  } else if (isStartHorizontal && !isEndHorizontal) {
    // Horizontal start (left/right), Vertical end (top/bottom)
    const canDirectTurn = (startSide === 'right' ? pStart.x <= pEnd.x : pStart.x >= pEnd.x) &&
                          (endSide === 'top' ? pStart.y <= pEnd.y : pStart.y >= pEnd.y);
    if (canDirectTurn) {
      pts = [start, pStart, { x: pEnd.x, y: pStart.y }, pEnd, end];
    } else {
      const escapeX = startSide === 'right' ? Math.max(pStart.x, pEnd.x) + 20 : Math.min(pStart.x, pEnd.x) - 20;
      const cornerY = endSide === 'top' ? pEnd.y - 20 : pEnd.y + 20;
      pts = [start, pStart, { x: escapeX, y: pStart.y }, { x: escapeX, y: cornerY }, { x: pEnd.x, y: cornerY }, pEnd, end];
    }
  } else {
    // Vertical start (top/bottom), Horizontal end (left/right)
    const canDirectTurn = (startSide === 'bottom' ? pStart.y <= pEnd.y : pStart.y >= pEnd.y) &&
                          (endSide === 'left' ? pStart.x <= pEnd.x : pStart.x >= pEnd.x);
    if (canDirectTurn) {
      pts = [start, pStart, { x: pStart.x, y: pEnd.y }, pEnd, end];
    } else {
      const escapeY = startSide === 'bottom' ? Math.max(pStart.y, pEnd.y) + 20 : Math.min(pStart.y, pEnd.y) - 20;
      const cornerX = endSide === 'left' ? pEnd.x - 20 : pEnd.x + 20;
      pts = [start, pStart, { x: pStart.x, y: escapeY }, { x: cornerX, y: escapeY }, { x: cornerX, y: pEnd.y }, pEnd, end];
    }
  }

  return straightenAlignedPolyline(simplifyPolyline(pts));
}

/**
 * Forces user waypoints into a valid orthogonal route between the two ports.
 */
export function buildManualPoints(
  start: Point,
  end: Point,
  waypoints: Point[],
  startSide: BorderSide = 'right',
  endSide: BorderSide = 'left'
): Point[] | null {
  if (waypoints.length === 0) {
    return buildOrthogonalConnector(start, end, startSide, endSide);
  }

  // 1. Straight vertical alignment check: if nodes and waypoints are all vertically aligned
  const isOpposingVertical =
    (startSide === 'bottom' && endSide === 'top') ||
    (startSide === 'top' && endSide === 'bottom');
  if (isOpposingVertical && Math.abs(start.x - end.x) <= STRAIGHT_ALIGN_TOLERANCE) {
    const alignX = Math.round((start.x + end.x) / 2);
    const allNearAlignX = waypoints.every((w) => Math.abs(w.x - alignX) <= STRAIGHT_ALIGN_TOLERANCE);
    if (allNearAlignX) {
      return [
        { x: alignX, y: start.y },
        { x: alignX, y: end.y },
      ];
    }
  }

  // 2. Straight horizontal alignment check: if nodes and waypoints are all horizontally aligned
  const isOpposingHorizontal =
    (startSide === 'right' && endSide === 'left') ||
    (startSide === 'left' && endSide === 'right');
  if (isOpposingHorizontal && Math.abs(start.y - end.y) <= STRAIGHT_ALIGN_TOLERANCE) {
    const alignY = Math.round((start.y + end.y) / 2);
    const allNearAlignY = waypoints.every((w) => Math.abs(w.y - alignY) <= STRAIGHT_ALIGN_TOLERANCE);
    if (allNearAlignY) {
      return [
        { x: start.x, y: alignY },
        { x: end.x, y: alignY },
      ];
    }
  }

  const pStart = getPortStubPoint(start, startSide, PORT_STUB);
  const pEnd = getPortStubPoint(end, endSide, PORT_STUB);

  const rawKeyPoints: Point[] = [pStart, ...waypoints, pEnd];
  const pts: Point[] = [start, pStart];

  for (let i = 0; i < rawKeyPoints.length - 1; i++) {
    const cur = pts[pts.length - 1];
    const next = rawKeyPoints[i + 1];

    if (Math.abs(cur.x - next.x) < 0.01 || Math.abs(cur.y - next.y) < 0.01) {
      pts.push({ x: next.x, y: next.y });
    } else {
      const lastSegmentVertical =
        pts.length >= 2 && Math.abs(pts[pts.length - 1].x - pts[pts.length - 2].x) < 0.01;
      if (lastSegmentVertical) {
        pts.push({ x: next.x, y: cur.y });
        pts.push({ x: next.x, y: next.y });
      } else {
        pts.push({ x: cur.x, y: next.y });
        pts.push({ x: next.x, y: next.y });
      }
    }
  }

  pts.push(end);

  const simplified = simplifyPolyline(pts);
  return straightenAlignedPolyline(simplified, STRAIGHT_ALIGN_TOLERANCE);
}

/** Converts an edited polyline back into the interior bend points that get persisted. */
export function extractWaypoints(points: Point[]): Point[] {
  return simplifyPolyline(points)
    .slice(1, -1)
    .map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
}

export interface PortAssignmentMap {
  start: Map<string, Point>;
  end: Map<string, Point>;
}

/**
 * Universally assigns port coordinates for all 4 sides of every node.
 * If 1 flow on a side: placed exactly at the middle (ratio 0.5).
 * If multiple flows on the same side: arranged evenly spaced, symmetrically centered around the middle.
 */
export function assignUniversalPorts(
  requests: RouteRequest[],
  nodeById: Map<string, RouterNode>
): PortAssignmentMap {
  const result: PortAssignmentMap = {
    start: new Map(),
    end: new Map(),
  };

  interface SideConn {
    request: RouteRequest;
    isSource: boolean;
    otherNode: RouterNode;
  }

  const groups = new Map<string, SideConn[]>();

  requests.forEach((r) => {
    const fromNode = nodeById.get(r.fromId);
    const toNode = nodeById.get(r.toId);
    if (!fromNode || !toNode) return;

    const inferred = inferDefaultBorderSides(fromNode, toNode);
    const sourceSide: BorderSide = r.sourceAnchor?.side || inferred.sourceSide;
    const targetSide: BorderSide = r.targetAnchor?.side || inferred.targetSide;

    const sourceKey = `${r.fromId}:${sourceSide}`;
    if (!groups.has(sourceKey)) groups.set(sourceKey, []);
    groups.get(sourceKey)!.push({
      request: r,
      isSource: true,
      otherNode: toNode,
    });

    const targetKey = `${r.toId}:${targetSide}`;
    if (!groups.has(targetKey)) groups.set(targetKey, []);
    groups.get(targetKey)!.push({
      request: r,
      isSource: false,
      otherNode: fromNode,
    });
  });

  groups.forEach((conns, key) => {
    const colonIdx = key.indexOf(':');
    const nodeId = key.substring(0, colonIdx);
    const side = key.substring(colonIdx + 1) as BorderSide;
    const node = nodeById.get(nodeId);
    if (!node) return;

    const centerY = (n: RouterNode) => n.y + n.height / 2;
    const centerX = (n: RouterNode) => n.x + n.width / 2;

    // Sorting connections along the edge avoids crossing lines
    if (side === 'left' || side === 'right') {
      conns.sort((a, b) => {
        return (
          centerY(a.otherNode) - centerY(b.otherNode) ||
          centerX(a.otherNode) - centerX(b.otherNode) ||
          a.request.key.localeCompare(b.request.key)
        );
      });
    } else {
      conns.sort((a, b) => {
        return (
          centerX(a.otherNode) - centerX(b.otherNode) ||
          centerY(a.otherNode) - centerY(b.otherNode) ||
          a.request.key.localeCompare(b.request.key)
        );
      });
    }

    const count = conns.length;
    conns.forEach((conn, index) => {
      const pt = getNodeSidePort(node, side, index, count);
      if (conn.isSource) {
        result.start.set(conn.request.key, pt);
      } else {
        result.end.set(conn.request.key, pt);
      }
    });
  });

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
  end: Point,
  startSide: BorderSide = 'right',
  endSide: BorderSide = 'left'
): Point[] {
  // 1. Direct Straight Vertical Check
  const isDirectVertical =
    (startSide === 'bottom' && endSide === 'top' && start.y < end.y) ||
    (startSide === 'top' && endSide === 'bottom' && start.y > end.y);

  if (isDirectVertical && Math.abs(start.x - end.x) <= STRAIGHT_ALIGN_TOLERANCE) {
    const alignX = Math.round((start.x + end.x) / 2);
    const col = Math.round(alignX / GRID);
    const rStart = Math.round((start.y + (startSide === 'bottom' ? PORT_STUB : -PORT_STUB)) / GRID);
    const rEnd = Math.round((end.y + (endSide === 'top' ? -PORT_STUB : PORT_STUB)) / GRID);
    const minR = Math.min(rStart, rEnd);
    const maxR = Math.max(rStart, rEnd);
    let clear = true;
    for (let r = minR; r <= maxR; r++) {
      if (r >= 0 && r < grid.rows && col >= 0 && col < grid.cols && grid.blocked[r * grid.cols + col]) {
        clear = false;
        break;
      }
    }
    if (clear) {
      return [{ x: alignX, y: start.y }, { x: alignX, y: end.y }];
    }
  }

  // 2. Direct Straight Horizontal Check
  const isDirectHorizontal =
    (startSide === 'right' && endSide === 'left' && start.x < end.x) ||
    (startSide === 'left' && endSide === 'right' && start.x > end.x);

  if (isDirectHorizontal && Math.abs(start.y - end.y) <= STRAIGHT_ALIGN_TOLERANCE) {
    const alignY = Math.round((start.y + end.y) / 2);
    const row = Math.round(alignY / GRID);
    const cStart = Math.round((start.x + (startSide === 'right' ? PORT_STUB : -PORT_STUB)) / GRID);
    const cEnd = Math.round((end.x + (endSide === 'left' ? -PORT_STUB : PORT_STUB)) / GRID);
    const minC = Math.min(cStart, cEnd);
    const maxC = Math.max(cStart, cEnd);
    let clear = true;
    for (let c = minC; c <= maxC; c++) {
      if (row >= 0 && row < grid.rows && c >= 0 && c < grid.cols && grid.blocked[row * grid.cols + c]) {
        clear = false;
        break;
      }
    }
    if (clear) {
      return [{ x: start.x, y: alignY }, { x: end.x, y: alignY }];
    }
  }

  const getCell = (p: Point, side: BorderSide) => {
    switch (side) {
      case 'right':
        return { c: Math.ceil((p.x + PORT_STUB) / GRID), r: Math.round(p.y / GRID) };
      case 'left':
        return { c: Math.floor((p.x - PORT_STUB) / GRID), r: Math.round(p.y / GRID) };
      case 'top':
        return { c: Math.round(p.x / GRID), r: Math.floor((p.y - PORT_STUB) / GRID) };
      case 'bottom':
        return { c: Math.round(p.x / GRID), r: Math.ceil((p.y + PORT_STUB) / GRID) };
    }
  };

  const sc = getCell(start, startSide);
  const ec = getCell(end, endSide);

  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const startCell = { c: clamp(sc.c, 1, grid.cols - 2), r: clamp(sc.r, 1, grid.rows - 2) };
  const goalCell = { c: clamp(ec.c, 1, grid.cols - 2), r: clamp(ec.r, 1, grid.rows - 2) };

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

  if (cells) {
    registerOccupancy(grid, cells);
    const body = cells.map((cell) => ({ x: cell.c * GRID, y: cell.r * GRID }));
    return straightenAlignedPolyline(simplifyPolyline([start, ...body, end]));
  } else {
    return buildOrthogonalConnector(start, end, startSide, endSide);
  }
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

  const ports = assignUniversalPorts(valid, nodeById);
  const grid = buildGrid(nodes, bounds);
  const routes = new Map<string, { points: Point[]; isManual: boolean }>();

  const endpoints = (r: RouteRequest) => {
    const from = nodeById.get(r.fromId)!;
    const to = nodeById.get(r.toId)!;
    const inferred = inferDefaultBorderSides(from, to);
    const startSide: BorderSide = r.sourceAnchor?.side || inferred.sourceSide;
    const endSide: BorderSide = r.targetAnchor?.side || inferred.targetSide;
    const start = ports.start.get(r.key) || getNodeSidePort(from, startSide, 0, 1);
    const end = ports.end.get(r.key) || getNodeSidePort(to, endSide, 0, 1);
    return { start, end, startSide, endSide };
  };

  // User routes with custom waypoints are laid down first so automatic routes flow around them.
  valid.forEach((r) => {
    const hasWaypoints = Boolean(r.waypoints && r.waypoints.length > 0);
    if (!hasWaypoints) return;

    const { start, end, startSide, endSide } = endpoints(r);
    const manual = buildManualPoints(start, end, r.waypoints!, startSide, endSide);
    if (!manual) return;
    registerPolylineOccupancy(grid, manual);
    routes.set(r.key, { points: manual, isManual: true });
  });

  valid
    .filter((r) => !routes.has(r.key))
    .map((r) => {
      const { start, end, startSide, endSide } = endpoints(r);
      return { r, start, end, startSide, endSide, span: Math.abs(end.x - start.x) + Math.abs(end.y - start.y) };
    })
    .sort((a, b) => a.span - b.span)
    .forEach(({ r, start, end, startSide, endSide }) => {
      const hasCustomAnchors = Boolean(r.sourceAnchor || r.targetAnchor);
      const points = routeAutomatically(grid, start, end, startSide, endSide);
      routes.set(r.key, { points, isManual: hasCustomAnchors });
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
