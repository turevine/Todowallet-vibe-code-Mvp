"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { getPreset } from "@/constants/design-presets";
import { formatDDay } from "@/lib/utils/date";
import MiniHeatmap from "@/components/MiniHeatmap";
import type { ProjectCardWithStats } from "@/types";

interface ProjectCardProps {
  card: ProjectCardWithStats;
  isFront: boolean;
}

export default function ProjectCard({ card, isFront }: ProjectCardProps) {
  const preset = getPreset(card.design_preset);
  const dDayText = formatDDay(card.d_day, card.is_completed);
  const isDDayOver = card.d_day !== null && card.d_day > 0 && !card.is_completed;

  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });

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
        aspectRatio: "1.6 / 1",
      }}
      whileHover={{ y: -4, boxShadow: "0 16px 30px rgba(0,0,0,0.18)" }}
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

        {/* 2줄: 총 투자시간 + D-Day */}
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-xl font-bold tracking-tight font-mono tabular-nums ${card.is_live_running ? "animate-pulse" : ""}`}>
            {card.total_hours_display}
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

        {/* isFront=true일 때만 히트맵 + 하단 표시 */}
        {isFront && (
          <>
            <div className="flex-1" />

            <div className="mt-3">
              <MiniHeatmap
                cardId={card.id}
                designPreset={card.design_preset}
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
