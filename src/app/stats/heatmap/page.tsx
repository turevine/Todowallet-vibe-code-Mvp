"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import { CircleRowSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useCards } from "@/lib/hooks/useCards";

function HeatmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeCards, completedCards, loading } = useCards();
  const initialCardId = searchParams.get("card") ?? undefined;

  const allCards = [...activeCards, ...completedCards];

  if (loading) {
    return (
      <div className="min-h-screen px-5 pt-20 space-y-3">
        <CircleRowSkeleton count={28} />
        <Skeleton className="h-8 w-2/5" />
        <CircleRowSkeleton count={28} />
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-white"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          className="pressable touch-target w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">히트맵 자세히 보기</h1>
      </header>

      {/* 히트맵 캘린더 */}
      <main className="flex-1 px-5 pb-8">
        <HeatmapCalendar cards={allCards} initialCardId={initialCardId} />
      </main>
    </motion.div>
  );
}

export default function HeatmapPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen px-5 pt-20 space-y-3">
            <CircleRowSkeleton count={28} />
            <Skeleton className="h-8 w-2/5" />
            <CircleRowSkeleton count={28} />
          </div>
        }
      >
        <HeatmapContent />
      </Suspense>
    </AuthGuard>
  );
}
