import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Bot, CheckCircle2, Copy, Terminal, Sparkles } from 'lucide-react';

interface MCPStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
}

export const MCPStatusModal: React.FC<MCPStatusModalProps> = ({ isOpen, onClose, isConnected }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const projectDir = 'c:\\Users\\thanh\\Desktop\\project\\Wode';

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        wode: {
          command: 'node',
          args: [`${projectDir}\\mcp-server\\dist\\index.js`],
          env: {
            WODE_WS_PORT: '3333',
          },
        },
      },
    },
    null,
    2
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Agent Connector (Model Context Protocol - MCP)" size="lg">
      <div className="space-y-4 text-sm text-gray-700 dark:text-slate-300">
        {/* Status Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            isConnected
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
              : 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <div>
              <div className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                {isConnected ? 'MCP Live Sync: Đang hoạt động' : 'MCP Server: Đang ở chế độ chờ (Standby)'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  ws://localhost:3333
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                {isConnected
                  ? 'Bất kỳ sơ đồ nào AI Agent vẽ thông qua MCP sẽ tự động cập nhật ngay lập tức lên Canvas này!'
                  : 'Khởi chạy server MCP bằng lệnh bên dưới để kết nối với Claude, Cursor hoặc Antigravity.'}
              </p>
            </div>
          </div>
          <Bot size={28} className={isConnected ? 'text-emerald-500' : 'text-amber-500'} />
        </div>

        {/* Command to run */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal size={14} /> Lệnh khởi chạy MCP Server
          </label>
          <div className="flex items-center gap-2 bg-gray-900 text-slate-100 p-2.5 rounded-lg font-mono text-xs">
            <span className="flex-1 select-all">npm run mcp</span>
            <button
              onClick={() => copyToClipboard('npm run mcp', 'cmd')}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              title="Copy lệnh"
            >
              {copiedKey === 'cmd' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Configuration for AI Agents */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} /> Cấu hình MCP cho Claude Desktop / Cursor / Antigravity
          </label>
          <div className="relative">
            <pre className="bg-gray-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-44">
              {mcpConfigJson}
            </pre>
            <button
              onClick={() => copyToClipboard(mcpConfigJson, 'json')}
              className="absolute top-2.5 right-2.5 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded shadow"
              title="Copy JSON cấu hình"
            >
              {copiedKey === 'json' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Capabilities list */}
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-gray-800 dark:text-slate-200">
            Các công cụ (MCP Tools) Agent có thể dùng:
          </div>
          <ul className="grid grid-cols-2 gap-1.5 text-gray-600 dark:text-slate-400">
            <li>• <b>wode_create_diagram</b>: Vẽ trọn vẹn quy trình 1 bước</li>
            <li>• <b>wode_get_diagram</b>: Đọc và phân tích sơ đồ</li>
            <li>• <b>wode_list_diagrams</b>: Quét các sơ đồ trong thư mục</li>
            <li>• <b>wode_add_role</b>: Thêm làn bơi (Swimlane) mới</li>
            <li>• <b>wode_add_frame</b>: Thêm phân đoạn / giai đoạn mới</li>
            <li>• <b>wode_add_node</b>: Thêm bước xử lý / nhiệm vụ</li>
            <li>• <b>wode_connect_nodes</b>: Nối dây và gán thông điệp</li>
            <li>• <b>wode_export_html</b>: Xuất viewer HTML offline</li>
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
