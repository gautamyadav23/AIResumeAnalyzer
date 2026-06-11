import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({
  title = 'System Interface Error',
  message = 'We encountered an error contacting our background services.',
  errorDetails = '',
  onRetry = null,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`p-8 rounded-2xl border border-theme-danger/20 bg-theme-danger/5 text-center max-w-lg mx-auto flex flex-col items-center justify-center ${className}`}>
      <div className="p-4 rounded-full bg-theme-danger/10 text-theme-danger mb-4 shrink-0">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold font-display text-theme-text mb-2">{title}</h3>
      <p className="text-sm text-theme-muted mb-6 leading-relaxed max-w-sm">{message}</p>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="danger"
          icon={<RefreshCw className="w-4 h-4" />}
          className="mb-4"
        >
          Try Again
        </Button>
      )}

      {errorDetails && (
        <div className="w-full border-t border-theme-border/50 pt-4 mt-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 text-xs font-semibold text-theme-muted hover:text-theme-text transition mx-auto"
          >
            <span>{showDetails ? 'Hide Error Details' : 'Show Error Details'}</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDetails && (
            <pre className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-left text-[10px] font-mono text-red-400 overflow-x-auto max-h-32 max-w-full leading-normal">
              {errorDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default ErrorState;
