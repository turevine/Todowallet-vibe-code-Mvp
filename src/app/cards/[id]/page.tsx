"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import ProjectCard from "@/components/ProjectCard";
import CheckInTimer from "@/components/CheckInTimer";
import TimeLogList from "@/components/TimeLogList";
import DesignPresetPicker from "@/components/DesignPresetPicker";
import ConfirmModal from "@/components/ConfirmModal";
import { useCards } from "@/lib/hooks/useCards";
import { useCheckIn } from "@/lib/hooks/useCheckIn";
import { useToast } from "@/lib/hooks/useToast";
import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { calculateDDay, calculateElapsedDays, getToday } from "@/lib/utils/date";
import { formatTotalTime } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import type { ProjectCard as ProjectCardRow, ProjectCardWithStats } from "@/types";

const supabase = createClient();

function CardDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeCards, completeCard, uncompleteCard, updateCard, refresh: refreshCards } = useCards();
  const { showToast } = useToast();

  const [card, setCard] = useState<ProjectCardWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPreset, setEditPreset] = useState("");

  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { timerState } = useCheckIn(id);

  const fetchCard = useCallback(async () => {
    const { data } = await supabase
      .from("project_cards")
      .select("*, time_logs(duration_seconds)")
      .eq("id", id)
      .single();

    if (data) {
      const logs = ((data.time_logs as { duration_seconds: number }[]) ?? []);
      const total_seconds = logs.reduce((sum: number, l: { duration_seconds: number }) => sum + l.duration_seconds, 0);
      const rest = { ...(data as Record<string, unknown>) };
      delete rest.time_logs;
      const cardRow = rest as unknown as ProjectCardRow;
      const enriched: ProjectCardWithStats = {
        ...cardRow,
        total_seconds,
        d_day: calculateDDay(cardRow.deadline),
        elapsed_days: calculateElapsedDays(cardRow.created_at),
        total_hours_display: formatTotalTime(total_seconds),
      };
      setCard(enriched);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  // Sync live data from useCards (real-time timer updates)
  useEffect(() => {
    if (!card) return;
    const liveCard = activeCards.find((c) => c.id === card.id);
    if (liveCard) {
      setCard((prev) => prev ? {
        ...prev,
        total_seconds: liveCard.total_seconds,
        total_hours_display: liveCard.total_hours_display,
        is_live_running: liveCard.is_live_running,
        live_elapsed_seconds: liveCard.live_elapsed_seconds,
      } : prev);
    }
  }, [activeCards, card?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeLogCreated = () => {
    fetchCard();
    setRefreshKey((k) => k + 1);
  };

  const handleComplete = async () => {
    if (!card) return;
    setShowCompleteConfirm(false);
    setActionLoading(true);
    await completeCard(card.id);
    await fetchCard();
    await refreshCards();
    setActionLoading(false);
    showToast("목표를 달성했습니다! 🎉", "success");
  };

  const handleUncomplete = async () => {
    if (!card) return;
    setActionLoading(true);
    await uncompleteCard(card.id);
    await fetchCard();
    await refreshCards();
    setActionLoading(false);
    showToast("목표 상태를 되돌렸습니다", "default");
  };

  const startEditing = () => {
    if (!card) return;
    setEditTitle(card.title);
    setEditDeadline(card.deadline ?? "");
    setEditPreset(card.design_preset);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!card || !editTitle.trim()) return;
    setActionLoading(true);
    await updateCard(card.id, {
      title: editTitle.trim(),
      deadline: editDeadline || null,
      design_preset: editPreset,
    });
    setEditing(false);
    await fetchCard();
    await refreshCards();
    setActionLoading(false);
    showToast("카드 정보가 저장되었습니다", "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen px-5 pt-20 space-y-4">
        <CardSkeleton />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-sm text-gray-400 mb-4">카드를 찾을 수 없습니다</p>
        <button
          onClick={() => router.replace("/home")}
          className="text-sm text-gray-600 underline"
        >
          홈으로 돌아가기
        </button>
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
      <header className="flex items-center justify-between px-5 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        {!card.is_completed && !editing && (
          <button
            onClick={startEditing}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            카드 편집하기
          </button>
        )}
        {editing && (
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(false)}
              className="pressable text-sm text-gray-400 hover:text-gray-600"
            >
              취소
            </button>
            <button
              onClick={saveEdit}
              disabled={actionLoading}
              className="pressable text-sm font-semibold text-gray-900 hover:text-gray-700 disabled:opacity-50"
            >
              {actionLoading ? "저장 중..." : "저장"}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 px-5 pb-10">
        {editing ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">목표 이름</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value.slice(0, 30))}
                className="w-full h-[48px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-gray-400 transition-colors"
              />
              <p className="text-[11px] text-gray-400 mt-1 text-right">{editTitle.length}/30</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                마감일 <span className="text-xs font-normal text-gray-400 ml-1">선택</span>
              </label>
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                min={getToday()}
                className="w-full h-[48px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-gray-400 transition-colors"
              />
              {editDeadline && (
                <button
                  onClick={() => setEditDeadline("")}
                  className="text-[12px] text-gray-400 hover:text-gray-600 mt-1.5 ml-1"
                >
                  마감일 없이 진행하기
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">카드 디자인</label>
              <DesignPresetPicker selectedId={editPreset} onSelect={setEditPreset} />
            </div>
          </div>
        ) : (
          <>
            {/* 카드 (실시간 시간이 카드 안에 표시됨) */}
            <div className="mb-6">
              <ProjectCard card={card} isFront />
            </div>

            {card.is_completed ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-4">이 목표를 달성했습니다</p>
                <button
                  onClick={handleUncomplete}
                  disabled={actionLoading}
                  className="pressable text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50"
                >
                  {actionLoading ? "처리 중..." : "되돌리기"}
                </button>
              </div>
            ) : (
              <>
                {/* 체크인/체크아웃 버튼 */}
                <div className="mb-8">
                  <CheckInTimer
                    cardId={card.id}
                    isCompleted={card.is_completed}
                    onTimeLogCreated={handleTimeLogCreated}
                    onComplete={() => setShowCompleteConfirm(true)}
                  />
                </div>

                {timerState === "idle" && (
                  <div className="border-t border-gray-100 pt-5">
                    <TimeLogList
                      cardId={card.id}
                      mode="recent"
                      refreshKey={refreshKey}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <ConfirmModal
        isOpen={showCompleteConfirm}
        title="목표 달성"
        description="이 목표를 달성 처리할까요?"
        confirmLabel={actionLoading ? "처리 중..." : "달성"}
        confirmColor="green"
        onConfirm={handleComplete}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </motion.div>
  );
}

export default function CardDetailPage() {
  return (
    <AuthGuard>
      <CardDetailContent />
    </AuthGuard>
  );
}
