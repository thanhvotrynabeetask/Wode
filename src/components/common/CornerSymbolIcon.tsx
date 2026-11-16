import React from 'react';
import { User, Bot, CheckCircle2, Clock } from 'lucide-react';
import { CornerSymbol } from '../../types/schema';

interface CornerSymbolIconProps {
  symbol: CornerSymbol;
  className?: string;
  size?: number;
}

export const CornerSymbolIcon: React.FC<CornerSymbolIconProps> = ({ symbol, className = '', size = 14 }) => {
  switch (symbol) {
    case 'user-action':
      return (
        <span title="Tác vụ người dùng" className="inline-flex">
          <User size={size} className={className} />
        </span>
      );
    case 'bot':
      return (
        <span title="Hệ thống tự động" className="inline-flex">
          <Bot size={size} className={className} />
        </span>
      );
    case 'check':
      return (
        <span title="Kiểm duyệt / Xác nhận" className="inline-flex">
          <CheckCircle2 size={size} className={className} />
        </span>
      );
    case 'timer':
      return (
        <span title="Chờ thời gian / Hẹn giờ" className="inline-flex">
          <Clock size={size} className={className} />
        </span>
      );
    case 'none':
    default:
      return null;
  }
};
