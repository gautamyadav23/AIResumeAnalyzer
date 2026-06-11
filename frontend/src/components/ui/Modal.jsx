import React from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60"
      />

      {/* Modal Container */}
      <div
        className={`bg-theme-card border border-theme-border w-full max-w-xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col ${className}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-card/30">
          <h3 className="text-lg font-bold font-display text-theme-text">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-muted hover:bg-theme-card-hover hover:text-theme-text transition duration-200"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
