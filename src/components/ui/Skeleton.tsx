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

/** 홈 페이지 스켈레톤: 히트맵 배너 + 카드 스택 실루엣 */
export function HomeSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-14 pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>

      <div className="flex-1 px-5">
        {/* 히트맵 배너 실루엣 */}
        <div className="mb-4 rounded-2xl bg-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="flex gap-[3px] flex-wrap">
            {Array.from({ length: 31 }).map((_, i) => (
              <Skeleton key={i} className="h-[10px] w-[10px] rounded-[3px]" />
            ))}
          </div>
        </div>

        {/* 카드관리 버튼 */}
        <div className="flex justify-end mb-3">
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>

        {/* 카드 스택 실루엣 (비율 1.6:1) */}
        <div className="relative">
          {/* 뒤 카드 (살짝 보이는 느낌) */}
          <div
            className="rounded-2xl bg-gray-100 w-[92%] mx-auto"
            style={{ aspectRatio: "1.6 / 1" }}
          />
          {/* 앞 카드 */}
          <div
            className="rounded-2xl bg-gray-100 shadow-lg -mt-[88%] relative"
            style={{ aspectRatio: "1.6 / 1" }}
          >
            <div className="px-5 pt-3 pb-5 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 rounded-md bg-gray-200" />
                  <Skeleton className="h-4 w-10 rounded-md bg-gray-200" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Skeleton className="h-7 w-20 rounded-md bg-gray-200" />
                  <Skeleton className="h-5 w-12 rounded-full bg-gray-200" />
                </div>
              </div>
              {/* 미니 히트맵 자리 */}
              <div className="flex gap-[3px] flex-wrap mt-auto">
                {Array.from({ length: 28 }).map((_, i) => (
                  <Skeleton key={i} className="h-[8px] w-[8px] rounded-[2px] bg-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 상세 페이지 스켈레톤: 헤더 + 카드 + 체크인 버튼 + 타임로그 */
export function CardDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pt-14 pb-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </header>

      <div className="flex-1 px-5 pb-10">
        {/* 카드 실루엣 (비율 1.6:1) */}
        <div
          className="rounded-2xl bg-gray-100 shadow-lg mb-6"
          style={{ aspectRatio: "1.6 / 1" }}
        >
          <div className="px-5 pt-3 pb-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded-md bg-gray-200" />
                <Skeleton className="h-4 w-10 rounded-md bg-gray-200" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Skeleton className="h-7 w-24 rounded-md bg-gray-200" />
                <Skeleton className="h-5 w-12 rounded-full bg-gray-200" />
              </div>
            </div>
            <div className="flex gap-[3px] flex-wrap mt-auto">
              {Array.from({ length: 28 }).map((_, i) => (
                <Skeleton key={i} className="h-[8px] w-[8px] rounded-[2px] bg-gray-200" />
              ))}
            </div>
          </div>
        </div>

        {/* 체크인 버튼 실루엣 */}
        <div className="mb-8 space-y-3">
          <Skeleton className="h-[52px] w-full rounded-xl bg-gray-200" />
          <Skeleton className="h-[44px] w-full rounded-xl" />
        </div>

        {/* 타임로그 리스트 실루엣 */}
        <div className="border-t border-gray-100 pt-5 space-y-3">
          <Skeleton className="h-4 w-20 rounded-md" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-14 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
