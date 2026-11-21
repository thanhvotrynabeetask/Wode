import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

const icons = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error: <AlertCircle size={16} className="text-red-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  info: <Info size={16} className="text-blue-500" />,
};

const bgClasses = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const ToastItem: React.FC<ToastItemProps> = ({ id, type, message }) => {
  const removeToast = useUIStore((s) => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(id), 4000);
    return () => clearTimeout(timer);
  }, [id, removeToast]);

  return (
    <div className={['flex items-start gap-2.5 px-3.5 py-3 rounded-lg border shadow-sm text-sm', bgClasses[type]].join(' ')}>
      <span className="mt-0.5 shrink-0">{icons[type]}</span>
      <span className="flex-1 text-gray-700">{message}</span>
      <button onClick={() => removeToast(id)} className="shrink-0 text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  // Max 4 toasts visible; extras stack below (chồng line) when more than 4 arrive
  const visible = toasts.slice(0, 4);
  const overflow = toasts.length - visible.length;

  return (
    <div
      className="fixed z-[100] flex flex-col gap-2 w-80"
      style={{
        // Giữa cạnh phải màn hình — không bottom, không top, không bị phủ bởi toolbar
        top: '50%',
        right: '16px',
        transform: 'translateY(-50%)',
      }}
    >
      {visible.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
      {overflow > 0 && (
        <div className="text-[11px] text-gray-500 dark:text-slate-400 text-center px-2">
          +{overflow} thông báo khác đang chờ
        </div>
      )}
    </div>
  );
};