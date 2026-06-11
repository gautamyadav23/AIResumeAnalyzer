import React from 'react';

const Progress = ({
  value = 0,
  height = 'h-2',
  variant = 'primary',
  showValue = false,
  className = ''
}) => {
  const percent = Math.min(100, Math.max(0, value));

  const bgColors = {
    primary: 'bg-theme-primary',
    success: 'bg-theme-success',
    warning: 'bg-theme-warning',
    danger: 'bg-theme-danger',
    info: 'bg-theme-info'
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      <div className="flex justify-between items-center text-xs font-semibold text-theme-muted">
        {showValue && <span>Progress</span>}
        {showValue && <span>{percent}%</span>}
      </div>
      <div className={`w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ${height}`}>
        <div
          style={{ width: `${percent}%`, transition: 'width 200ms ease-out' }}
          className={`h-full rounded-full ${bgColors[variant]}`}
        />
      </div>
    </div>
  );
};

export default Progress;
