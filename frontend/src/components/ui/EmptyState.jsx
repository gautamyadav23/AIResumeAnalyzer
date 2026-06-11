import React from 'react';
import { HelpCircle } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  title,
  description,
  icon = null,
  actionLabel = '',
  onAction = null,
  suggestions = [],
  onSuggestionClick = null,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-theme-border bg-theme-card/20 text-center max-w-lg mx-auto ${className}`}>
      <div className="p-4 rounded-full bg-theme-primary/5 text-theme-primary mb-4 shrink-0">
        {icon || <HelpCircle className="w-8 h-8" />}
      </div>
      
      <h3 className="text-xl font-bold font-display text-theme-text mb-2">{title}</h3>
      <p className="text-sm text-theme-muted mb-6 max-w-sm leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" className="mb-6">
          {actionLabel}
        </Button>
      )}

      {suggestions.length > 0 && (
        <div className="w-full border-t border-theme-border pt-5 mt-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted block mb-3">Suggested Quick Starts</span>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick && onSuggestionClick(sug)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-text transition duration-200"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
