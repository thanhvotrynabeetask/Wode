import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useUIStore } from '../store/useUIStore';

let globalWs: WebSocket | null = null;

export function useMCPLiveSync() {
  const [isConnected, setIsConnected] = useState(false);
  const loadSchema = useProjectStore((s) => s.loadSchema);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    let timer: any = null;
    let isMounted = true;

    function connect() {
      if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        const ws = new WebSocket('ws://localhost:3333');
        globalWs = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          console.log('[Wode MCP LiveSync] Đã kết nối với MCP Server (ws://localhost:3333)');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'SCHEMA_UPDATE' && data.schema) {
              loadSchema(data.schema);
              addToast('info', `🤖 ${data.message || 'AI Agent đã cập nhật sơ đồ qua MCP!'}`);
            }
          } catch (err) {
            console.warn('[Wode MCP LiveSync] Lỗi phân tích thông điệp:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          globalWs = null;
          // Silent reconnect
          timer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          // Silent fail / retry
          ws.close();
        };
      } catch {
        timer = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (globalWs) {
        globalWs.close();
        globalWs = null;
      }
    };
  }, [loadSchema, addToast]);

  return { isConnected };
}
