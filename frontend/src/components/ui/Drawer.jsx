import React from 'react';
import { X } from 'lucide-react';

const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'max-w-md'
}) => {
  const isBottom = position === 'bottom';

  const containerClasses = {
    right: 'right-0 top-0 bottom-0 h-full border-l',
    left: 'left-0 top-0 bottom-0 h-full border-r',
    bottom: 'bottom-0 left-0 right-0 h-[60vh] border-t'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60"
      />

      {/* Drawer container */}
      <div
        className={`absolute bg-theme-card border-theme-border w-full flex flex-col shadow-2xl ${containerClasses[position]} ${isBottom ? '' : size}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-card/30">
          <h3 className="text-lg font-bold font-display text-theme-text">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:bg-theme-card-hover hover:text-theme-text transition duration-200"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Drawer;
