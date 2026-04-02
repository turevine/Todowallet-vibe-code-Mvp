"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTimeLogs } from "@/lib/hooks/useTimeLogs";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatShortTime } from "@/lib/utils/format";
import { differenceInCalendarDays, format } from "date-fns";

interface TimeLogListProps {
  cardId: string;
  mode: "recent" | "all";
  refreshKey?: number;
}

function formatLogDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + "T00:00:00");
  const diff = differenceInCalendarDays(today, date);

  if (diff === 0) return "오늘";
  if (diff === 1) return "어제";
  return format(date, "M/d");
}

function formatTimeRange(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(start)} ~ ${fmt(end)}`;
}

function formatSessionDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export default function TimeLogList({ cardId, mode, refreshKey }: TimeLogListProps) {
  const router = useRouter();
  const { recentLogs, allLogs, loading, fetchRecentLogs, fetchAllLogs } = useTimeLogs();

  useEffect(() => {
    if (mode === "recent") {
      fetchRecentLogs(cardId);
    } else {
      fetchAllLogs(cardId);
    }
  }, [cardId, mode, fetchRecentLogs, fetchAllLogs, refreshKey]);

  const logs = mode === "recent" ? recentLogs : allLogs;

  if (loading && logs.length === 0) {
    return (
      <div className="py-3 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-400">
        아직 기록이 없어요
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">
          {mode === "recent" ? "최근 기록" : "전체 기록"}
        </span>
        {mode === "recent" && (
          <button
            onClick={() => router.push(`/stats/heatmap?card=${cardId}`)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            모두보기
          </button>
        )}
      </div>

      {/* 목록 */}
      <div className="space-y-1">
        {logs.map((log) => (
          <div key={log.date} className="py-2.5 px-1">
            {/* 날짜 + 총 시간 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {formatLogDate(log.date)}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {formatShortTime(log.totalSeconds)}
              </span>
            </div>
            {/* 개별 세션 시간대 */}
            {log.sessions.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {log.sessions.map((session, i) => (
                  <div key={i} className="flex items-center justify-between pl-2">
                    <span className="text-[11px] text-gray-400">
                      {formatTimeRange(session.startedAt, session.endedAt)}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {formatSessionDuration(session.durationSeconds)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
