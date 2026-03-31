"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import CardManageList from "@/components/CardManageList";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useCards } from "@/lib/hooks/useCards";

function ManageContent() {
  const router = useRouter();
  const { activeCards, completedCards, loading, updateCardOrder, softDeleteCard } = useCards();

  if (loading) {
    return (
      <div className="min-h-screen px-5 pt-20 space-y-3">
        <CardSkeleton />
        <CardSkeleton />
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
        <h1 className="text-xl font-bold text-gray-900">카드 관리</h1>
      </header>

      {/* 리스트 */}
      <main className="flex-1 px-5 pb-8">
        <CardManageList
          activeCards={activeCards}
          completedCards={completedCards}
          onReorder={updateCardOrder}
          onDelete={softDeleteCard}
        />
      </main>
    </motion.div>
  );
}

export default function ManageCardsPage() {
  return (
    <AuthGuard>
      <ManageContent />
    </AuthGuard>
  );
}
