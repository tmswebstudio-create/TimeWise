import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 - 100
  color?: string; // default blue
  height?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'bg-blue-600',
  height = 'h-1.5',
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height} ${className}`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-300 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
