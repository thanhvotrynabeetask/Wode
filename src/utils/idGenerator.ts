export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function generateInstanceId(baseId: string): string {
  return `inst_${baseId}_${Date.now()}`;
}

export function generateFrameId(): string {
  return generateId('frame');
}

export function generateRoleId(): string {
  return generateId('role');
}

export function generateNodeId(): string {
  return generateId('node');
}

export function generateDiagramId(): string {
  return generateId('diag');
}
