import { LayoutNode, LayoutEdge } from '../services/LayoutEngine';

/**
 * Finds all nodes between startInstanceId and targetInstanceId.
 * Prioritizes directed/undirected graph edge paths (e.g. A -> B -> C).
 * If no graph path exists, falls back to the sequential visual order on the chart.
 */
export function findNodesBetweenInFlow(
  startId: string,
  targetId: string,
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): string[] {
  if (startId === targetId) return [startId];

  // 1. Try to find a path along edges (Forward search: start -> target)
  const forwardPath = findGraphPath(startId, targetId, edges, true);
  if (forwardPath.length > 0) return forwardPath;

  // 2. Try backward search (target -> start)
  const backwardPath = findGraphPath(targetId, startId, edges, true);
  if (backwardPath.length > 0) return backwardPath;

  // 3. Try undirected edge search
  const undirectedPath = findGraphPath(startId, targetId, edges, false);
  if (undirectedPath.length > 0) return undirectedPath;

  // 4. Fallback: visual sequence order in layout.nodes
  const idxA = nodes.findIndex((n) => n.instanceId === startId);
  const idxB = nodes.findIndex((n) => n.instanceId === targetId);

  if (idxA !== -1 && idxB !== -1) {
    const min = Math.min(idxA, idxB);
    const max = Math.max(idxA, idxB);
    return nodes.slice(min, max + 1).map((n) => n.instanceId);
  }

  return [startId, targetId];
}

function findGraphPath(
  source: string,
  target: string,
  edges: LayoutEdge[],
  directed: boolean
): string[] {
  const adj = new Map<string, string[]>();

  edges.forEach((e) => {
    if (!adj.has(e.fromInstanceId)) adj.set(e.fromInstanceId, []);
    adj.get(e.fromInstanceId)!.push(e.toInstanceId);

    if (!directed) {
      if (!adj.has(e.toInstanceId)) adj.set(e.toInstanceId, []);
      adj.get(e.toInstanceId)!.push(e.fromInstanceId);
    }
  });

  // BFS with path tracking
  const queue: string[][] = [[source]];
  const visited = new Set<string>([source]);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];

    if (last === target) {
      return path;
    }

    const neighbors = adj.get(last) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }

  return [];
}
