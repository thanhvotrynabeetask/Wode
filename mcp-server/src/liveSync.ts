import { WebSocketServer, WebSocket } from 'ws';
import { ProjectSchema } from './types.js';
import { DEFAULT_WS_PORT } from './constants.js';

export class LiveSyncServer {
  private static wss: WebSocketServer | null = null;
  private static clients: Set<WebSocket> = new Set();
  private static activeSchema: ProjectSchema | null = null;
  private static port: number = DEFAULT_WS_PORT;

  public static start(port: number = DEFAULT_WS_PORT): void {
    if (this.wss) return;
    this.port = port;

    try {
      this.wss = new WebSocketServer({ port });

      this.wss.on('connection', (ws) => {
        this.clients.add(ws);
        console.error(`[Wode MCP LiveSync] Client connected (total: ${this.clients.size})`);

        // Send active schema on new connection if available
        if (this.activeSchema) {
          ws.send(JSON.stringify({
            type: 'SCHEMA_UPDATE',
            schema: this.activeSchema,
            source: 'initial_sync',
          }));
        }

        ws.on('close', () => {
          this.clients.delete(ws);
          console.error(`[Wode MCP LiveSync] Client disconnected (remaining: ${this.clients.size})`);
        });

        ws.on('error', (err) => {
          console.error(`[Wode MCP LiveSync] Client socket error:`, err.message);
          this.clients.delete(ws);
        });
      });

      this.wss.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`[Wode MCP LiveSync] Port ${port} is in use; live sync disabled for this run.`);
        } else {
          console.error(`[Wode MCP LiveSync] Server error:`, err.message);
        }
      });

      console.error(`[Wode MCP LiveSync] Running on ws://localhost:${port}`);
    } catch (e: any) {
      console.error(`[Wode MCP LiveSync] Failed to start WebSocket server:`, e.message);
    }
  }

  public static broadcastSchema(schema: ProjectSchema, message?: string): void {
    this.activeSchema = schema;
    if (this.clients.size === 0) return;

    const payload = JSON.stringify({
      type: 'SCHEMA_UPDATE',
      schema,
      message: message || 'Cập nhật từ AI Agent qua MCP',
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err: any) {
          console.error(`[Wode MCP LiveSync] Failed to send to client:`, err.message);
        }
      }
    }
  }

  public static getActiveSchema(): ProjectSchema | null {
    return this.activeSchema;
  }

  public static setActiveSchema(schema: ProjectSchema): void {
    this.activeSchema = schema;
  }

  public static getConnectedClientCount(): number {
    return this.clients.size;
  }
}
