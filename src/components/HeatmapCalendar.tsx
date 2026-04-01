"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMonthRange } from "@/lib/utils/date";
import { formatDurationKorean } from "@/lib/utils/format";
import { getPreset } from "@/constants/design-presets";
import { getDaysInMonth, getDay } from "date-fns";
import { motion } from "framer-motion";
import type { ProjectCardWithStats } from "@/types";

/* ── 색상 단계 ── */
const BRAND = "#6366F1";

function getDotStyle(seconds: number): { backgroundColor: string; opacity: number } {
  if (seconds === 0) return { backgroundColor: "#E5E7EB", opacity: 1 };
  if (seconds <= 3600) return { backgroundColor: BRAND, opacity: 0.3 };
  if (seconds <= 10800) return { backgroundColor: BRAND, opacity: 0.6 };
  return { backgroundColor: BRAND, opacity: 1.0 };
}

/* ── 카드별 미니 히트맵 한 줄 ── */
function CardMiniRow({
  days,
  accentColor,
}: {
  days: { date: string; seconds: number }[];
  accentColor: string;
}) {
  return (
    <div className="flex gap-[3px] flex-wrap">
      {days.map((d) => (
        <div
          key={d.date}
          className="w-[8px] h-[8px] rounded-full"
          style={{
            backgroundColor: d.seconds > 0 ? accentColor : "#E5E7EB",
            opacity: d.seconds === 0 ? 0.4 : d.seconds <= 3600 ? 0.4 : d.seconds <= 10800 ? 0.7 : 1,
          }}
        />
      ))}
    </div>
  );
}

/* ── 요일 라벨 ── */
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/* ── 메인 컴포넌트 ── */
interface HeatmapCalendarProps {
  cards: ProjectCardWithStats[];
  initialCardId?: string;
}

interface DayData {
  date: string;
  day: number;
  totalSeconds: number;
}

interface CardDayBreakdown {
  cardId: string;
  title: string;
  designPreset: string;
  seconds: number;
}

interface CardMonthlySummary {
  cardId: string;
  title: string;
  designPreset: string;
  totalSeconds: number;
  days: { date: string; seconds: number }[];
}

export default function HeatmapCalendar({ cards, initialCardId }: HeatmapCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterCardId, setFilterCardId] = useState<string>(initialCardId ?? "all");

  // 히트맵 데이터
  const [dayMap, setDayMap] = useState<Map<string, number>>(new Map());
  // 날짜 선택 시 카드별 상세
  const [dateBreakdown, setDateBreakdown] = useState<CardDayBreakdown[]>([]);
  // 카드별 월간 요약
  const [cardSummaries, setCardSummaries] = useState<CardMonthlySummary[]>([]);

  const allCards = useMemo(() => cards, [cards]);

  // 월 네비게이션
  const handleMonthChange = useCallback((dir: "prev" | "next") => {
    setCurrentMonth((prev) => {
      if (dir === "prev") {
        return prev.month === 1
          ? { year: prev.year - 1, month: 12 }
          : { year: prev.year, month: prev.month - 1 };
      }
      return prev.month === 12
        ? { year: prev.year + 1, month: 1 }
        : { year: prev.year, month: prev.month + 1 };
    });
    setSelectedDate(null);
  }, []);

  // 1) 전체 히트맵 데이터 로드
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { start, end } = getMonthRange(currentMonth.year, currentMonth.month);

      let query = supabase
        .from("time_logs")
        .select("logged_date, duration_seconds, card_id")
        .eq("user_id", session.user.id)
        .gte("logged_date", start)
        .lte("logged_date", end);

      if (filterCardId !== "all") {
        query = query.eq("card_id", filterCardId);
      }

      const { data } = await query;
      if (!data) return;

      // 날짜별 합산
      const map = new Map<string, number>();
      data.forEach((row) => {
        map.set(row.logged_date, (map.get(row.logged_date) ?? 0) + row.duration_seconds);
      });
      setDayMap(map);

      // 카드별 월간 요약
      const totalDays = getDaysInMonth(new Date(currentMonth.year, currentMonth.month - 1));
      const cardMap = new Map<string, Map<string, number>>();
      data.forEach((row) => {
        if (!cardMap.has(row.card_id)) cardMap.set(row.card_id, new Map());
        const cm = cardMap.get(row.card_id)!;
        cm.set(row.logged_date, (cm.get(row.logged_date) ?? 0) + row.duration_seconds);
      });

      const summaries: CardMonthlySummary[] = [];
      for (const [cardId, dateMap] of cardMap) {
        const card = allCards.find((c) => c.id === cardId);
        if (!card) continue;
        let total = 0;
        const days: { date: string; seconds: number }[] = [];
        for (let d = 1; d <= totalDays; d++) {
          const date = `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const sec = dateMap.get(date) ?? 0;
          total += sec;
          days.push({ date, seconds: sec });
        }
        summaries.push({
          cardId,
          title: card.title,
          designPreset: card.design_preset,
          totalSeconds: total,
          days,
        });
      }
      summaries.sort((a, b) => b.totalSeconds - a.totalSeconds);
      setCardSummaries(summaries);
    }
    load();
  }, [currentMonth.year, currentMonth.month, filterCardId, allCards]);

  // 2) 선택된 날짜의 카드별 상세
  useEffect(() => {
    if (!selectedDate) {
      return;
    }
    async function loadBreakdown() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      let query = supabase
        .from("time_logs")
        .select("card_id, duration_seconds")
        .eq("user_id", session.user.id)
        .eq("logged_date", selectedDate!);

      if (filterCardId !== "all") {
        query = query.eq("card_id", filterCardId);
      }

      const { data } = await query;
      if (!data) return;

      const cardTotals = new Map<string, number>();
      data.forEach((row) => {
        cardTotals.set(row.card_id, (cardTotals.get(row.card_id) ?? 0) + row.duration_seconds);
      });

      const breakdown: CardDayBreakdown[] = [];
      for (const [cardId, seconds] of cardTotals) {
        const card = allCards.find((c) => c.id === cardId);
        if (!card) continue;
        breakdown.push({
          cardId,
          title: card.title,
          designPreset: card.design_preset,
          seconds,
        });
      }
      breakdown.sort((a, b) => b.seconds - a.seconds);
      setDateBreakdown(breakdown);
    }
    loadBreakdown();
  }, [selectedDate, filterCardId, allCards]);

  // 달력 그리드 생성
  const totalDays = getDaysInMonth(new Date(currentMonth.year, currentMonth.month - 1));
  const firstDayOfWeek = getDay(new Date(currentMonth.year, currentMonth.month - 1, 1)); // 0=일

  const calendarDays: (DayData | null)[] = useMemo(() => {
    const cells: (DayData | null)[] = [];
    // 빈 셀 (월 시작 전)
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    // 실제 날짜
    for (let d = 1; d <= totalDays; d++) {
      const date = `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ date, day: d, totalSeconds: dayMap.get(date) ?? 0 });
    }
    return cells;
  }, [currentMonth.year, currentMonth.month, totalDays, firstDayOfWeek, dayMap]);

  const weeks: (DayData | null)[][] = useMemo(() => {
    const result: (DayData | null)[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // 필터 변경
  const handleFilterChange = useCallback(
    (cardId: string) => {
      setFilterCardId(cardId);
      const params = new URLSearchParams(searchParams.toString());
      if (cardId === "all") {
        params.delete("card");
      } else {
        params.set("card", cardId);
      }
      router.replace(`/stats/heatmap?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  // 선택 날짜 총 시간
  const selectedTotal = dateBreakdown.reduce((sum, b) => sum + b.seconds, 0);
  const selectedMonth = selectedDate ? parseInt(selectedDate.split("-")[1]) : 0;
  const selectedDay = selectedDate ? parseInt(selectedDate.split("-")[2]) : 0;

  return (
    <div className="space-y-6">
      {/* 카드 필터 드롭다운 */}
      <div className="flex justify-end">
        <select
          value={filterCardId}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-indigo-300"
        >
          <option value="all">전체</option>
          {allCards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.title}
            </option>
          ))}
        </select>
      </div>

      {/* 월 네비게이션 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleMonthChange("prev")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
        >
          ◀
        </button>
        <span className="text-base font-semibold text-gray-800">
          {currentMonth.month}월 {currentMonth.year}
        </span>
        <button
          onClick={() => handleMonthChange("next")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400"
        >
          ▶
        </button>
      </div>

      {/* 요일 라벨 */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-[11px] font-medium text-gray-400 pb-1">
            {wd}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell, ci) => {
              if (!cell) {
                return <div key={`empty-${ci}`} className="aspect-square" />;
              }
              const isSelected = selectedDate === cell.date;
              const dotStyle = getDotStyle(cell.totalSeconds);

              return (
                <button
                  key={cell.date}
                  onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                  className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ${
                    isSelected ? "bg-indigo-50 ring-1 ring-indigo-300" : "hover:bg-gray-50"
                  }`}
                >
                  <motion.div
                    className="w-6 h-6 rounded-full"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.18, delay: Math.min((wi * 7 + ci) * 0.006, 0.2) }}
                    style={dotStyle}
                  />
                  <span className={`text-[10px] ${isSelected ? "text-indigo-600 font-semibold" : "text-gray-500"}`}>
                    {cell.day}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDate && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-800">
              {selectedMonth}/{selectedDay}
            </span>
            <span className="text-sm text-gray-400">—</span>
            <span className="text-sm text-gray-600">
              총 {formatDurationKorean(selectedTotal)}
            </span>
          </div>

          {dateBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400">기록이 없어요</p>
          ) : (
            <div className="space-y-2">
              {dateBreakdown.map((b) => {
                const preset = getPreset(b.designPreset);
                return (
                  <div key={b.cardId} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: preset.gradient }}
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">{b.title}</span>
                    <span className="text-sm text-gray-500 font-medium">
                      {formatDurationKorean(b.seconds)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 카드별 요약 */}
      {cardSummaries.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">카드별 요약</h3>
          <div className="space-y-4">
            {cardSummaries.map((summary) => {
              const preset = getPreset(summary.designPreset);
              return (
                <div key={summary.cardId}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: preset.gradient }}
                    />
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {summary.title}
                    </span>
                    <span className="text-sm text-gray-500 font-medium shrink-0">
                      {formatDurationKorean(summary.totalSeconds)}
                    </span>
                  </div>
                  <CardMiniRow days={summary.days} accentColor={preset.accentColor} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
