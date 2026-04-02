"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import CardStack from "@/components/CardStack";
import CompletedSection from "@/components/CompletedSection";
import HeatmapBanner from "@/components/HeatmapBanner";
import ConfirmModal from "@/components/ConfirmModal";
import { HomeSkeleton } from "@/components/ui/Skeleton";
import { useCards } from "@/lib/hooks/useCards";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePageView } from "@/lib/hooks/usePageView";
import { useToast } from "@/lib/hooks/useToast";
import { useTodayMode } from "@/lib/hooks/useTodayMode";
import { getPreset } from "@/constants/design-presets";
import { formatDate } from "@/lib/utils/date";
import type { ProjectCardWithStats } from "@/types";

/* ── 휴지통 뷰 ── */
function TrashView({
  onBack,
  fetchDeletedCards,
  restoreCard,
  hardDeleteCard,
}: {
  onBack: () => void;
  fetchDeletedCards: () => Promise<ProjectCardWithStats[]>;
  restoreCard: (id: string) => Promise<"restored" | "already_deleted" | "error">;
  hardDeleteCard: (id: string) => Promise<void>;
}) {
  const { showToast } = useToast();
  const [deletedCards, setDeletedCards] = useState<ProjectCardWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmTarget, setConfirmTarget] = useState<ProjectCardWithStats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const cards = await fetchDeletedCards();
    setDeletedCards(cards);
    setLoading(false);
  }, [fetchDeletedCards]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleRestore = async (id: string) => {
    const result = await restoreCard(id);
    if (result === "restored") {
      showToast("카드를 복원했습니다", "success");
    } else if (result === "already_deleted") {
      showToast("이미 삭제된 카드입니다", "warning");
    } else {
      showToast("복원에 실패했어요. 잠시 후 다시 시도해주세요", "error");
    }
    await load();
  };

  const handleHardDelete = async () => {
    if (!confirmTarget) return;
    await hardDeleteCard(confirmTarget.id);
    showToast("카드를 영구 삭제했습니다", "default");
    setConfirmTarget(null);
    await load();
  };

  const getDaysUntilPermanentDelete = (deletedAt: string | null) => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = now.getTime() - deleted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-2 mb-4">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <span className="text-[16px] font-semibold text-gray-900">휴지통</span>
      </div>

      {/* 리스트 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      ) : deletedCards.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-.867 12.142A2 2 0 0116.138 20H7.862a2 2 0 01-1.995-1.858L5 6" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">휴지통이 비어있어요</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {deletedCards.map((card) => {
            const preset = getPreset(card.design_preset);
            const daysLeft = getDaysUntilPermanentDelete(card.deleted_at);
            return (
              <div
                key={card.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 opacity-50"
                  style={{ background: preset.gradient }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">{card.title}</p>
                  <p className="text-[11px] text-gray-400">
                    {card.deleted_at && formatDate(card.deleted_at)} · {daysLeft}일 후 영구 삭제
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRestore(card.id)}
                    className="pressable px-2.5 py-1.5 text-[12px] font-medium text-indigo-500 bg-indigo-50 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
                  >
                    복원
                  </button>
                  <button
                    onClick={() => setConfirmTarget(card)}
                    className="pressable px-2.5 py-1.5 text-[12px] font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 영구 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!confirmTarget}
        title="영구 삭제"
        description={`"${confirmTarget?.title ?? ""}" 카드와 모든 기록을 삭제합니다.\n모든 기록이 삭제됩니다.`}
        confirmLabel="삭제"
        confirmColor="red"
        onConfirm={handleHardDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}

/* ── 설정 바텀시트 ── */
function SettingsSheet({
  isOpen,
  onClose,
  fetchDeletedCards,
  restoreCard,
  hardDeleteCard,
}: {
  isOpen: boolean;
  onClose: () => void;
  fetchDeletedCards: () => Promise<ProjectCardWithStats[]>;
  restoreCard: (id: string) => Promise<"restored" | "already_deleted" | "error">;
  hardDeleteCard: (id: string) => Promise<void>;
}) {
  const { signOut, deleteAccount } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"menu" | "trash">("menu");
  const [confirmType, setConfirmType] = useState<"logout" | "delete" | null>(null);

  // 닫힐 때 메뉴 뷰로 리셋
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setView("menu"), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    setConfirmType(null);
    await signOut();
    router.replace("/");
  };

  const handleDeleteAccount = async () => {
    setConfirmType(null);
    await deleteAccount();
    router.replace("/");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* 바텀시트 */}
          <motion.div
            className="fixed bottom-0 left-1/2 w-full max-w-app-card bg-white rounded-t-3xl z-50 pb-8 safe-area-bottom"
            style={{ x: "-50%" }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          >
            {/* 드래그 핸들 */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />

            <div className="px-6">
              {view === "menu" ? (
                <div className="space-y-1">
                  <button
                    onClick={() => setView("trash")}
                    className="pressable touch-target w-full py-3.5 text-left text-[15px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-xl px-3 transition-colors"
                  >
                    🗑️ 휴지통
                  </button>
                  <button
                    onClick={() => setConfirmType("logout")}
                    className="pressable touch-target w-full py-3.5 text-left text-[15px] text-gray-700 hover:bg-gray-50 active:bg-gray-100 rounded-xl px-3 transition-colors"
                  >
                    로그아웃
                  </button>
                  <button
                    onClick={() => setConfirmType("delete")}
                    className="pressable touch-target w-full py-3.5 text-left text-[15px] text-red-500 hover:bg-red-50 active:bg-red-100 rounded-xl px-3 transition-colors"
                  >
                    회원 탈퇴
                  </button>
                </div>
              ) : (
                <TrashView
                  onBack={() => setView("menu")}
                  fetchDeletedCards={fetchDeletedCards}
                  restoreCard={restoreCard}
                  hardDeleteCard={hardDeleteCard}
                />
              )}
            </div>
          </motion.div>

          {/* 로그아웃 확인 */}
          <ConfirmModal
            isOpen={confirmType === "logout"}
            title="로그아웃"
            description="로그아웃 하시겠습니까?"
            confirmLabel="예"
            confirmColor="red"
            onConfirm={handleSignOut}
            onCancel={() => setConfirmType(null)}
          />

          {/* 회원 탈퇴 확인 */}
          <ConfirmModal
            isOpen={confirmType === "delete"}
            title="회원 탈퇴"
            description="회원을 탈퇴하시겠습니까?\n모든 카드와 기록이 소멸됩니다."
            confirmLabel="예"
            confirmColor="red"
            onConfirm={handleDeleteAccount}
            onCancel={() => setConfirmType(null)}
          />
        </>
      )}
    </AnimatePresence>
  );
}

/* ── 홈 콘텐츠 ── */
function HomeContent() {
  const {
    activeCards, completedCards, loading,
    softDeleteCard, completeCard, updateCard,
    fetchDeletedCards, restoreCard, hardDeleteCard,
  } = useCards();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cardOpening, setCardOpening] = useState(false);
  const { todayMode, toggleTodayMode } = useTodayMode();
  const isNewCardEntry = searchParams.get("new") === "1";

  usePageView();

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-white"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="home-frame w-full mx-auto">
        {/* 헤더 */}
        <header className="flex items-center justify-between px-5 pt-14 pb-4">
          <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Image src="/favicon.svg" alt="TodoWallet 로고" width={24} height={24} priority />
            <span>TodoWallet</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              className="pressable touch-target w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/cards/new")}
              className="pressable touch-target w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </header>

        {/* 메인 */}
        <main className="flex-1 px-5 pb-8">
        {/* 히트맵 배너 */}
        <AnimatePresence initial={false}>
          {activeCards.length > 0 && !cardOpening && (
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2 }}
            >
              <HeatmapBanner cards={activeCards} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
          <section className="lg:w-[430px] lg:shrink-0">
            {activeCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  아직 프로젝트가 없어요
                </p>
                <button
                  onClick={() => router.push("/cards/new")}
                  className="pressable touch-target px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-colors"
                >
                  첫 번째 카드 만들기
                </button>
              </div>
            ) : (
              <div className="card-column lg:mx-0">
                {/* 오늘 토글 + 카드 관리 */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={toggleTodayMode}
                    className="pressable flex items-center gap-1.5 py-1 px-2"
                  >
                    <div
                      className={`relative w-8 h-[18px] rounded-full transition-colors duration-200 ${
                        todayMode ? "bg-indigo-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          todayMode ? "translate-x-[16px]" : "translate-x-[2px]"
                        }`}
                      />
                    </div>
                    <span className={`text-xs transition-colors ${todayMode ? "text-indigo-500 font-medium" : "text-gray-400"}`}>
                      오늘
                    </span>
                  </button>
                  <button
                    onClick={() => router.push("/cards/manage")}
                    className="pressable text-xs text-gray-400 hover:text-gray-600 transition-colors py-1 px-2"
                  >
                    카드관리
                  </button>
                </div>

                <CardStack
                  cards={activeCards}
                  newCardEntry={isNewCardEntry}
                  todayMode={todayMode}
                  onCardOpenStart={() => setCardOpening(true)}
                  onDelete={softDeleteCard}
                  onComplete={completeCard}
                  onUpdateDesign={async (id, preset) => {
                    await updateCard(id, { design_preset: preset });
                  }}
                />
              </div>
            )}
          </section>

          <aside className="mt-8 lg:mt-0 lg:w-[430px] lg:max-w-[430px] lg:ml-auto">
            <CompletedSection cards={completedCards} />
          </aside>
        </div>
        </main>
      </div>

      {/* 설정 바텀시트 */}
      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fetchDeletedCards={fetchDeletedCards}
        restoreCard={restoreCard}
        hardDeleteCard={hardDeleteCard}
      />
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}
