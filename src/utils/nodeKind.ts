import { NodeKind } from '../types/schema';

export interface NodeKindMeta {
  label: string;
  tag: string;
  hint: string;
  color: string;
}

export const NODE_KIND_META: Record<Exclude<NodeKind, 'standard'>, NodeKindMeta> = {
  storage: {
    label: 'Storage',
    tag: 'Storage Object',
    hint: 'Database, cache, kho dữ liệu... tự hút vào làn khi kéo thả.',
    color: '#0284C7',
  },
  mediator: {
    label: 'Kênh trung gian',
    tag: 'Kênh trung gian',
    hint: 'Queue, API gateway, webhook... tự hút vào làn khi kéo thả.',
    color: '#7C3AED',
  },
};

export const isSpecialKind = (kind?: NodeKind): kind is 'storage' | 'mediator' =>
  kind === 'storage' || kind === 'mediator';
