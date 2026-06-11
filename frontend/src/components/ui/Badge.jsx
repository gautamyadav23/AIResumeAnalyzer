import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border tracking-wide';
  
  const variants = {
    primary: 'bg-theme-primary/10 border-theme-primary/20 text-theme-primary',
    success: 'bg-theme-success/10 border-theme-success/20 text-theme-success',
    warning: 'bg-theme-warning/10 border-theme-warning/20 text-theme-warning',
    danger: 'bg-theme-danger/10 border-theme-danger/20 text-theme-danger',
    info: 'bg-theme-info/10 border-theme-info/20 text-theme-info',
    secondary: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
