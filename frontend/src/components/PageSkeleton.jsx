import React from 'react';
import { CardSkeleton, ChartSkeleton } from './ui/Skeleton';

const PageSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ChartSkeleton />
    </div>
  );
};

export default PageSkeleton;
