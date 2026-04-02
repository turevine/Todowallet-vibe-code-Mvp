"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getPreset } from "@/constants/design-presets";
import { formatDDay } from "@/lib/utils/date";
import { formatTotalTime } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import MiniHeatmap from "@/components/MiniHeatmap";
import type { ProjectCardWithStats } from "@/types";

interface TodaySession {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
}

/** 새벽 5시 기준으로 "오늘" 날짜 범위 반환 */
function getTodayRange(): { from: string; to: string } {
  const now = new Date();
  const base = new Date(now);
  // 현재 시간이 0~4시면 어제 5시부터
  if (now.getHours() < 5) {
    base.setDate(base.getDate() - 1);
  }
  base.setHours(5, 0, 0, 0);
  const from = base.toISOString();

  const end = new Date(base);
  end.setDate(end.getDate() + 1);
  const to = end.toISOString();

  return { from, to };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const SESSIONS_PER_PAGE = 10;

function TodaySessionList({
  sessions,
  textColor,
}: {
  sessions: TodaySession[];
  textColor: string;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE);
  const displayed = sessions.slice(
    page * SESSIONS_PER_PAGE,
    (page + 1) * SESSIONS_PER_PAGE,
  );

  return (
    <div className="mt-1.5 flex flex-col items-end">
      {displayed.map((s, i) => (
        <span
          key={page * SESSIONS_PER_PAGE + i}
          className="text-[10px] leading-[16px] opacity-50"
          style={{ color: textColor }}
        >
          {formatTime(s.startedAt)} ~ {formatTime(s.endedAt)}
        </span>
      ))}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-1">
          {page > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPage((p) => p - 1); }}
              className="text-[9px] opacity-40 hover:opacity-70"
              style={{ color: textColor }}
            >
              ▲ 이전
            </button>
          )}
          <span className="text-[9px] opacity-30" style={{ color: textColor }}>
            {page + 1}/{totalPages}
          </span>
          {page < totalPages - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPage((p) => p + 1); }}
              className="text-[9px] opacity-40 hover:opacity-70"
              style={{ color: textColor }}
            >
              ▼ 다음
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ProjectCardProps {
  card: ProjectCardWithStats;
  isFront: boolean;
  todayMode?: boolean;
}

export default function ProjectCard({ card, isFront, todayMode = false }: ProjectCardProps) {
  const preset = getPreset(card.design_preset);
  const dDayText = formatDDay(card.d_day, card.is_completed);
  const isDDayOver = card.d_day !== null && card.d_day > 0 && !card.is_completed;

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [todaySessions, setTodaySessions] = useState<TodaySession[]>([]);

  // 오늘 세션 로드 (새벽 5시 기준) — todayMode에서 시간 표시를 위해 항상 로드
  useEffect(() => {
    if (card.id === "preview") return;
    const supabase = createClient();
    const { from, to } = getTodayRange();

    supabase
      .from("time_logs")
      .select("started_at, ended_at, duration_seconds")
      .eq("card_id", card.id)
      .gte("started_at", from)
      .lt("started_at", to)
      .order("started_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setTodaySessions(
            data.map((r) => ({
              startedAt: r.started_at,
              endedAt: r.ended_at,
              durationSeconds: r.duration_seconds,
            })),
          );
        }
      });
  }, [card.id, card.total_seconds]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      if (direction === "prev") {
        return prev.month === 1
          ? { year: prev.year - 1, month: 12 }
          : { year: prev.year, month: prev.month - 1 };
      }
      return prev.month === 12
        ? { year: prev.year + 1, month: 1 }
        : { year: prev.year, month: prev.month + 1 };
    });
  };

  return (
    <motion.div
      className={`relative rounded-2xl shadow-lg overflow-hidden ${preset.patternClass ?? ""}`}
      style={{
        background: preset.gradient,
        minHeight: isFront ? undefined : undefined,
        aspectRatio: isFront && todaySessions.length > 0 ? undefined : "1.6 / 1",
      }}
      whileHover={{ y: -4, boxShadow: "0 16px 30px rgba(0,0,0,0.18)" }}
      whileTap={{ y: -4, boxShadow: "0 16px 30px rgba(0,0,0,0.18)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="px-5 pt-3 pb-5 h-full flex flex-col" style={{ color: preset.textColor }}>
        {/* 1줄: 제목 + 진행일수 */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold truncate flex-1 mr-3">
            {card.title}
          </h3>
          <div className="flex items-center gap-1.5">
            {card.is_live_running && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse" />
                진행중
              </span>
            )}
            <span className="text-xs opacity-70 whitespace-nowrap">
              {card.elapsed_days}일째
            </span>
          </div>
        </div>

        {/* 2줄: 총 투자시간 or 오늘 시간 + D-Day */}
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-xl font-bold tracking-tight font-mono tabular-nums ${card.is_live_running ? "animate-pulse" : ""}`}>
            {todayMode
              ? formatTotalTime(
                  todaySessions.reduce((s, t) => s + t.durationSeconds, 0)
                  + (card.live_elapsed_seconds ?? 0),
                )
              : card.total_hours_display}
          </span>
          {dDayText && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isDDayOver
                  ? "rgba(239,68,68,0.2)"
                  : "rgba(255,255,255,0.12)",
                color: isDDayOver ? "#FCA5A5" : preset.textColor,
              }}
            >
              {dDayText}
            </span>
          )}
        </div>

        {/* 오늘 세션 목록 (D-Day 아래, 오른쪽 정렬) */}
        {isFront && todaySessions.length > 0 && (
          <TodaySessionList sessions={todaySessions} textColor={preset.textColor} />
        )}

        {/* isFront=true일 때만 히트맵 + 하단 표시 */}
        {isFront && (
          <>
            <div className="flex-1" />

            <div className="mt-3">
              <MiniHeatmap
                cardId={card.id}
                designPreset={card.design_preset}
                targetSeconds={card.target_seconds ?? undefined}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
              />
            </div>

            <div className="flex-1" />

            <div className="flex justify-end mt-2">
              <span className="text-[10px] font-medium tracking-wider opacity-40 uppercase">
                Project
              </span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
