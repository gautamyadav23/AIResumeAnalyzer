import React from 'react';

// Basic inline text or box skeleton
const Skeleton = ({ className = '', variant = 'text', ...props }) => {
  const baseClasses = 'animate-shimmer rounded bg-slate-200 dark:bg-slate-800';
  
  const variants = {
    text: 'h-4 w-3/4 my-1',
    title: 'h-6 w-1/2 my-2',
    circle: 'rounded-full shrink-0',
    rect: 'w-full'
  };

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

// Card Skeleton
export const CardSkeleton = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-theme-border bg-theme-card/40 animate-pulse flex flex-col gap-4 ${className}`}>
    <div className="flex justify-between items-center">
      <Skeleton variant="text" className="w-1/3 h-3" />
      <Skeleton variant="circle" className="w-8 h-8" />
    </div>
    <Skeleton variant="title" className="w-2/3 h-8" />
    <Skeleton variant="text" className="w-1/2 h-3" />
  </div>
);

// Table/List Skeleton
export const TableSkeleton = ({ rows = 4, className = '' }) => (
  <div className={`space-y-4 w-full ${className}`}>
    <div className="flex justify-between items-center py-2 border-b border-theme-border">
      <Skeleton variant="text" className="w-1/4 h-4" />
      <Skeleton variant="text" className="w-1/6 h-4" />
      <Skeleton variant="text" className="w-1/6 h-4" />
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div key={idx} className="flex justify-between items-center py-3 border-b border-theme-border/50">
        <div className="flex items-center gap-3 w-1/3">
          <Skeleton variant="circle" className="w-8 h-8" />
          <Skeleton variant="text" className="w-3/4 h-3" />
        </div>
        <Skeleton variant="text" className="w-1/6 h-3" />
        <Skeleton variant="text" className="w-1/6 h-3" />
      </div>
    ))}
  </div>
);

// Chart Skeleton
export const ChartSkeleton = ({ className = '' }) => (
  <div className={`p-6 rounded-2xl border border-theme-border bg-theme-card/40 animate-pulse flex flex-col gap-6 ${className}`}>
    <div className="flex justify-between items-center">
      <Skeleton variant="title" className="w-1/4 h-5" />
      <Skeleton variant="text" className="w-1/6 h-3" />
    </div>
    {/* Mimic Recharts layout bar grid */}
    <div className="h-48 flex items-end gap-3 justify-between px-2">
      <Skeleton variant="rect" className="h-24 w-full" />
      <Skeleton variant="rect" className="h-32 w-full" />
      <Skeleton variant="rect" className="h-16 w-full" />
      <Skeleton variant="rect" className="h-40 w-full" />
      <Skeleton variant="rect" className="h-28 w-full" />
      <Skeleton variant="rect" className="h-36 w-full" />
    </div>
    <div className="flex justify-between px-2">
      <Skeleton variant="text" className="w-12 h-2.5" />
      <Skeleton variant="text" className="w-12 h-2.5" />
      <Skeleton variant="text" className="w-12 h-2.5" />
      <Skeleton variant="text" className="w-12 h-2.5" />
      <Skeleton variant="text" className="w-12 h-2.5" />
      <Skeleton variant="text" className="w-12 h-2.5" />
    </div>
  </div>
);

// Profile Page Skeleton
export const ProfileSkeleton = ({ className = '' }) => (
  <div className={`space-y-8 animate-pulse ${className}`}>
    <div className="p-6 rounded-2xl border border-theme-border bg-theme-card/40 flex flex-col sm:flex-row items-center gap-6">
      <Skeleton variant="circle" className="w-20 h-20" />
      <div className="flex-1 flex flex-col gap-2 items-center sm:items-start text-center sm:text-left w-full">
        <Skeleton variant="title" className="w-1/3 h-6" />
        <Skeleton variant="text" className="w-1/2 h-3" />
        <Skeleton variant="text" className="w-1/4 h-3" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export default Skeleton;
