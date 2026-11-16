import React from 'react';

interface BadgeProps {
  count: number;
  color?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ count, color, className = '' }) => {
  const style = color ? { backgroundColor: color + '33', color } : undefined;
  const defaultClass = 'bg-gray-100 text-gray-600';
  return (
    <span
      className={['inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-xs font-semibold', !color && defaultClass, className].join(' ')}
      style={style}
    >
      x{count}
    </span>
  );
};
