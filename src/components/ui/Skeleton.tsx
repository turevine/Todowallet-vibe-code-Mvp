"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton rounded-xl ${className}`.trim()} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 shadow-lg">
      <Skeleton className="h-5 w-2/3 mb-3" />
      <Skeleton className="h-8 w-1/2 mb-6" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

export function CircleRowSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} className="h-[10px] w-[10px] rounded-full" />
      ))}
    </div>
  );
}
