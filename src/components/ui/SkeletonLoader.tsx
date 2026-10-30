import React from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-purple-100/60 via-purple-50/80 to-purple-100/60 rounded-xl ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => {
  return (
    <div className="p-6 bg-white rounded-3xl border border-purple-100 shadow-soft space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-3 ${i === rows - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
};

export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="p-5 bg-white rounded-2xl border border-purple-100 shadow-soft space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
    </div>
  );
};

export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-soft">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-14" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <div className="pt-2 flex justify-between items-center border-t border-purple-50">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
};
