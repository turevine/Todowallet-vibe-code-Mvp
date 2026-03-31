"use client";

import { type KeyboardEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPreset } from "@/constants/design-presets";
import { getMonthRange } from "@/lib/utils/date";
import { getDaysInMonth } from "date-fns";
import type { HeatmapDay } from "@/types";

const supabase = createClient();

interface MiniHeatmapProps {
  cardId: string;
  designPreset: string;
  currentMonth: { year: number; month: number };
  onMonthChange: (direction: "prev" | "next") => void;
}

function getOpacity(seconds: number): number {
  if (seconds === 0) return 0.2;
  if (seconds <= 3600) return 0.4;
  if (seconds <= 10800) return 0.7;
  return 1.0;
}

export default function MiniHeatmap({
  cardId,
  designPreset,
  currentMonth,
  onMonthChange,
}: MiniHeatmapProps) {
  const [days, setDays] = useState<HeatmapDay[]>([]);
  const preset = getPreset(designPreset);

  useEffect(() => {
    const { start, end } = getMonthRange(currentMonth.year, currentMonth.month);
    const totalDays = getDaysInMonth(new Date(currentMonth.year, currentMonth.month - 1));

    supabase
      .from("time_logs")
      .select("logged_date, duration_seconds")
      .eq("card_id", cardId)
      .gte("logged_date", start)
      .lte("logged_date", end)
      .then(({ data }) => {
        const map = new Map<string, number>();
        (data ?? []).forEach((row) => {
          const prev = map.get(row.logged_date) ?? 0;
          map.set(row.logged_date, prev + row.duration_seconds);
        });

        const result: HeatmapDay[] = [];
        for (let d = 1; d <= totalDays; d++) {
          const date = `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          result.push({ date, totalSeconds: map.get(date) ?? 0 });
        }
        setDays(result);
      });
  }, [cardId, currentMonth.year, currentMonth.month]);

  const COLS = 15;
  const rows = [days.slice(0, COLS), days.slice(COLS, COLS * 2)];
  // days beyond 30 go to row 2 naturally

  const handleMonthKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    direction: "prev" | "next",
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onMonthChange(direction);
    }
  };

  return (
    <div>
      {/* 월 선택 */}
      <div className="flex items-center gap-3 mb-2.5">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onMonthChange("prev")}
          onKeyDown={(e) => handleMonthKeyDown(e, "prev")}
          className="text-sm opacity-60 hover:opacity-100 transition-opacity px-1"
          style={{ color: preset.textColor }}
        >
          ◀
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: preset.textColor, opacity: 0.8 }}
        >
          {currentMonth.month}월
        </span>
        <div
          role="button"
          tabIndex={0}
          onClick={() => onMonthChange("next")}
          onKeyDown={(e) => handleMonthKeyDown(e, "next")}
          className="text-sm opacity-60 hover:opacity-100 transition-opacity px-1"
          style={{ color: preset.textColor }}
        >
          ▶
        </div>
      </div>

      {/* 히트맵 그리드 */}
      <div className="flex flex-col gap-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5 flex-wrap">
            {row.map((day) => (
              <div
                key={day.date}
                className="w-[10px] h-[10px] rounded-full"
                style={{
                  backgroundColor:
                    day.totalSeconds > 0 ? preset.accentColor : preset.textColor,
                  opacity: getOpacity(day.totalSeconds),
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
