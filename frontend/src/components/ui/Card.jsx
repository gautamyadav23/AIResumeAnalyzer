import React from 'react';

const Card = ({
  children,
  header = null,
  footer = null,
  className = '',
  onClick = null,
  glow = false,
  hoverEffect = false,
  ...props
}) => {
  const isClickable = !!onClick;
  
  const baseStyle = `rounded-xl border border-theme-border bg-theme-card overflow-hidden relative transition-all duration-150`;
  const hoverStyle = hoverEffect || isClickable 
    ? 'hover:bg-theme-card-hover hover:border-theme-primary/30 cursor-pointer' 
    : '';

  return (
    <div
      className={`${baseStyle} ${hoverStyle} ${className}`}
      onClick={onClick}
      {...props}
    >
      {header && (
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-theme-border bg-theme-card-hover flex justify-between items-center">
          {header}
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
      {footer && (
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-theme-border bg-theme-card-hover text-xs">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
