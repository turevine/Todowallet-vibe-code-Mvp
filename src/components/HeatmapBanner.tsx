"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPreset } from "@/constants/design-presets";
import { getMonthRange } from "@/lib/utils/date";
import { formatDurationKorean, getHeatmapOpacity } from "@/lib/utils/format";
import { getDaysInMonth } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CircleRowSkeleton } from "@/components/ui/Skeleton";
import type { ProjectCardWithStats, HeatmapDay } from "@/types";

const DEFAULT_TARGET = 3600;

function getOpacity(seconds: number, targetSeconds: number = DEFAULT_TARGET): number {
  if (seconds === 0) return 0.15;
  return getHeatmapOpacity(seconds, targetSeconds);
}

interface HeatmapBannerProps {
  cards: ProjectCardWithStats[];
}

interface CardHeatmapData {
  card: ProjectCardWithStats;
  days: HeatmapDay[];
  totalSeconds: number;
}

export default function HeatmapBanner({ cards }: HeatmapBannerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardDataList, setCardDataList] = useState<CardHeatmapData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedCardId, setLockedCardId] = useState<string | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const totalDays = getDaysInMonth(new Date(year, month - 1));

  // 모든 카드의 히트맵 데이터 로드
  useEffect(() => {
    if (cards.length === 0) return;

    async function loadAll() {
      const supabase = createClient();
      const { start, end } = getMonthRange(year, month);

      const resultPromises = cards.map(async (card) => {
        const { data } = await supabase
          .from("time_logs")
          .select("logged_date, duration_seconds")
          .eq("card_id", card.id)
          .gte("logged_date", start)
          .lte("logged_date", end);

        const map = new Map<string, number>();
        (data ?? []).forEach((row) => {
          map.set(row.logged_date, (map.get(row.logged_date) ?? 0) + row.duration_seconds);
        });

        const days: HeatmapDay[] = [];
        let totalSeconds = 0;
        for (let d = 1; d <= totalDays; d++) {
          const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const sec = map.get(date) ?? 0;
          totalSeconds += sec;
          days.push({ date, totalSeconds: sec });
        }
        return { card, days, totalSeconds };
      });

      const results = await Promise.all(resultPromises);
      // 카드 스택 순서의 역순으로 배너 노출
      results.sort(
        (a, b) =>
          cards.findIndex((c) => c.id === b.card.id) -
          cards.findIndex((c) => c.id === a.card.id),
      );
      setCardDataList(results);
    }
    loadAll();
  }, [cards, year, month, totalDays]);

  useEffect(() => {
    async function loadPreference() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;

      const { data } = await supabase
        .from("user_banner_preferences")
        .select("is_locked, locked_card_id")
        .eq("user_id", uid)
        .maybeSingle();

      if (!data) return;
      setIsLocked(!!data.is_locked);
      setLockedCardId(data.locked_card_id ?? null);
    }
    void loadPreference();
  }, []);

  useEffect(() => {
    if (!isLocked || !lockedCardId || cardDataList.length === 0) return;
    const idx = cardDataList.findIndex((item) => item.card.id === lockedCardId);
    if (idx >= 0) setCurrentIndex(idx);
  }, [cardDataList, isLocked, lockedCardId]);

  // 30초 자동 전환 (고정 상태면 중단)
  useEffect(() => {
    if (isLocked || cardDataList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cardDataList.length);
    }, 30000);
    return () => clearInterval(interval);
  }, [cardDataList.length, isLocked]);

  // 수동 전환
  const handleDotClick = useCallback((idx: number) => {
    setCurrentIndex(idx);
  }, []);

  const persistLockPreference = useCallback(async (nextLocked: boolean, nextCardId: string | null) => {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("user_banner_preferences").upsert(
      {
        user_id: userId,
        is_locked: nextLocked,
        locked_card_id: nextCardId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }, [userId]);

  const goNext = useCallback(() => {
    if (cardDataList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % cardDataList.length);
  }, [cardDataList.length]);

  const goPrev = useCallback(() => {
    if (cardDataList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + cardDataList.length) % cardDataList.length);
  }, [cardDataList.length]);

  if (cards.length === 0) return null;
  if (cardDataList.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 p-4">
        <div className="mb-2"><CircleRowSkeleton count={16} /></div>
        <CircleRowSkeleton count={16} />
      </div>
    );
  }

  const current = cardDataList[currentIndex];
  if (!current) return null;

  const preset = getPreset(current.card.design_preset);

  // 2줄로 나열
  const COLS = 16;
  const rows = [current.days.slice(0, COLS), current.days.slice(COLS)];

  const handleOpenDetail = () => {
    if (isSwiping) {
      setIsSwiping(false);
      return;
    }
    router.push(`/stats/heatmap?card=${current.card.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpenDetail}
      onTouchStart={(e) => {
        if (isLocked) return;
        touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
        setIsSwiping(false);
      }}
      onTouchEnd={(e) => {
        if (isLocked) return;
        const startX = touchStartXRef.current;
        const endX = e.changedTouches[0]?.clientX;
        if (startX == null || endX == null) return;
        const dx = endX - startX;
        if (Math.abs(dx) < 40) return;
        setIsSwiping(true);
        if (dx < 0) goNext();
        else goPrev();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenDetail();
        }
      }}
      className="w-full text-left cursor-pointer"
    >
      <div
        className={`relative rounded-2xl overflow-hidden ${preset.patternClass ?? ""}`}
        style={{ background: preset.gradient }}
      >
        <div className="absolute top-2 right-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const nextLocked = !isLocked;
              const nextCardId = nextLocked ? current.card.id : null;
              setIsLocked(nextLocked);
              setLockedCardId(nextCardId);
              void persistLockPreference(nextLocked, nextCardId);
            }}
            className={`px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-sm transition-colors ${
              isLocked ? "bg-white/30" : "bg-white/15"
            }`}
            style={{ color: preset.textColor }}
          >
            고정 {isLocked ? "ON" : "OFF"}
          </button>
        </div>
        <div className="px-4 py-3.5" style={{ color: preset.textColor }}>
          {/* 카드 정보 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current.card.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{current.card.title}</span>
                  <span className="text-[10px] opacity-50">
                    {month}월 {formatDurationKorean(current.totalSeconds)}
                  </span>
                </div>
              </div>

              {/* 히트맵 2줄 나열 */}
              <div className="flex flex-col gap-1.5">
                {rows.map((row, ri) => (
                  <div key={ri} className="flex gap-1.5">
                    {row.map((day, idx) => (
                      <motion.div
                        key={day.date}
                        className="w-[10px] h-[10px] rounded-full"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: getOpacity(day.totalSeconds, current.card.target_seconds ?? DEFAULT_TARGET), scale: 1 }}
                        transition={{ duration: 0.18, delay: idx * 0.015 + ri * 0.04 }}
                        style={{
                          backgroundColor:
                            day.totalSeconds > 0 ? preset.accentColor : preset.textColor,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] opacity-40">
                    목표 {formatDurationKorean(current.card.target_seconds ?? DEFAULT_TARGET)}/일
                  </span>
                  {(() => {
                    const activeDays = current.days.filter((d) => d.totalSeconds > 0);
                    if (activeDays.length === 0) return null;
                    const avg = Math.round(
                      activeDays.reduce((s, d) => s + d.totalSeconds, 0) / activeDays.length,
                    );
                    return (
                      <span className="text-[10px] opacity-30">
                        평균 {formatDurationKorean(avg)}/일
                      </span>
                    );
                  })()}
                </div>
                <span className="text-[10px] opacity-40">자세히 →</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* 인디케이터 dots (카드 2개 이상일 때) */}
          {cardDataList.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {cardDataList.map((_, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(idx);
                  }}
                  className="p-0.5"
                >
                  <div
                    className="rounded-full transition-all duration-200"
                    style={{
                      width: idx === currentIndex ? 12 : 4,
                      height: 4,
                      backgroundColor: preset.textColor,
                      opacity: idx === currentIndex ? 0.8 : 0.25,
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
