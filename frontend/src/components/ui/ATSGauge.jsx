import React from 'react';


const ATSGauge = ({
  score = 0,
  size = 'md', // 'sm' | 'md' | 'lg'
  showLabel = true,
  className = '',
  invertColors = false
}) => {
  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  // Color tier rules
  const getTierDetails = (val) => {
    if (invertColors) {
      if (val <= 25) return { color: 'text-theme-success', stroke: 'rgb(var(--color-success))', label: 'Low', bg: 'rgba(var(--color-success) / 0.1)' };
      if (val <= 50) return { color: 'text-theme-primary', stroke: 'rgb(var(--color-primary))', label: 'Moderate', bg: 'rgba(var(--color-primary) / 0.1)' };
      if (val <= 75) return { color: 'text-theme-warning', stroke: 'rgb(var(--color-warning))', label: 'Significant', bg: 'rgba(var(--color-warning) / 0.1)' };
      return { color: 'text-theme-danger', stroke: 'rgb(var(--color-danger))', label: 'Severe', bg: 'rgba(var(--color-danger) / 0.1)' };
    }
    if (val >= 90) return { color: 'text-theme-success', stroke: 'rgb(var(--color-success))', label: 'Excellent', bg: 'rgba(var(--color-success) / 0.1)' };
    if (val >= 75) return { color: 'text-theme-primary', stroke: 'rgb(var(--color-primary))', label: 'Good', bg: 'rgba(var(--color-primary) / 0.1)' };
    if (val >= 60) return { color: 'text-theme-warning', stroke: 'rgb(var(--color-warning))', label: 'Average', bg: 'rgba(var(--color-warning) / 0.1)' };
    return { color: 'text-theme-danger', stroke: 'rgb(var(--color-danger))', label: 'Needs Improvement', bg: 'rgba(var(--color-danger) / 0.1)' };
  };

  const tier = getTierDetails(finalScore);

  const dimensions = {
    sm: { width: 80, strokeWidth: 6, radius: 32, fontSize: 'text-lg', labelSize: 'text-[9px]' },
    md: { width: 140, strokeWidth: 10, radius: 56, fontSize: 'text-3xl', labelSize: 'text-[11px]' },
    lg: { width: 220, strokeWidth: 16, radius: 88, fontSize: 'text-5xl', labelSize: 'text-sm' }
  };

  const d = dimensions[size] || dimensions.md;
  const circumference = 2 * Math.PI * d.radius;
  const strokeDashoffset = circumference - (finalScore / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center relative select-none ${className}`}>
      <div className="relative" style={{ width: d.width, height: d.width }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${d.width} ${d.width}`}>
          {/* Background circle */}
          <circle
            cx={d.width / 2}
            cy={d.width / 2}
            r={d.radius}
            className="stroke-slate-200 dark:stroke-slate-800 fill-transparent"
            strokeWidth={d.strokeWidth}
          />
          {/* Animated fill circle */}
          <circle
            cx={d.width / 2}
            cy={d.width / 2}
            r={d.radius}
            fill="transparent"
            stroke={tier.stroke}
            strokeWidth={d.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 200ms ease-out' }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-display font-extrabold tracking-tight text-theme-text ${d.fontSize}`}>
            {finalScore}
            {size !== 'sm' && <span className="text-sm font-semibold text-theme-muted">%</span>}
          </span>
          {showLabel && size !== 'sm' && (
            <span className={`font-semibold tracking-wider uppercase text-theme-muted mt-0.5 ${d.labelSize}`}>
              {tier.label}
            </span>
          )}
        </div>
      </div>
      {showLabel && size === 'sm' && (
        <span className={`font-bold uppercase tracking-wider text-theme-muted mt-2 text-[10px] ${tier.color}`}>
          {tier.label}
        </span>
      )}
    </div>
  );
};

export default ATSGauge;
