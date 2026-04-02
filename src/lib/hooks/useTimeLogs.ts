"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

export interface TimeSession {
  startedAt: string;   // ISO string
  endedAt: string;     // ISO string
  durationSeconds: number;
}

export interface DailyLog {
  date: string;        // YYYY-MM-DD
  totalSeconds: number;
  sessions: TimeSession[];  // 개별 세션 (시작~종료 시간)
}

export function useTimeLogs() {
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [allLogs, setAllLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentLogs = useCallback(async (cardId: string, limit = 7) => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("time_logs")
      .select("logged_date, duration_seconds, started_at, ended_at")
      .eq("card_id", cardId)
      .order("logged_date", { ascending: false })
      .order("started_at", { ascending: false });

    if (data) {
      const map = new Map<string, { totalSeconds: number; sessions: TimeSession[] }>();
      data.forEach((row) => {
        const entry = map.get(row.logged_date) ?? { totalSeconds: 0, sessions: [] };
        entry.totalSeconds += row.duration_seconds;
        entry.sessions.push({
          startedAt: row.started_at,
          endedAt: row.ended_at,
          durationSeconds: row.duration_seconds,
        });
        map.set(row.logged_date, entry);
      });
      const logs = Array.from(map.entries())
        .map(([date, { totalSeconds, sessions }]) => ({
          date,
          totalSeconds,
          sessions: sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
        }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limit);
      setRecentLogs(logs);
    }
    setLoading(false);
  }, []);

  const fetchAllLogs = useCallback(async (cardId: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("time_logs")
      .select("logged_date, duration_seconds, started_at, ended_at")
      .eq("card_id", cardId)
      .order("logged_date", { ascending: false })
      .order("started_at", { ascending: false });

    if (data) {
      const map = new Map<string, { totalSeconds: number; sessions: TimeSession[] }>();
      data.forEach((row) => {
        const entry = map.get(row.logged_date) ?? { totalSeconds: 0, sessions: [] };
        entry.totalSeconds += row.duration_seconds;
        entry.sessions.push({
          startedAt: row.started_at,
          endedAt: row.ended_at,
          durationSeconds: row.duration_seconds,
        });
        map.set(row.logged_date, entry);
      });
      const logs = Array.from(map.entries())
        .map(([date, { totalSeconds, sessions }]) => ({
          date,
          totalSeconds,
          sessions: sessions.sort((a, b) => a.startedAt.localeCompare(b.startedAt)),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
      setAllLogs(logs);
    }
    setLoading(false);
  }, []);

  const createTimeLog = useCallback(
    async (cardId: string, startedAt: string, endedAt: string, durationSeconds: number): Promise<boolean> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const loggedDate = format(new Date(startedAt), "yyyy-MM-dd");

      const { error } = await supabase.from("time_logs").insert(
        {
          card_id: cardId,
          user_id: user.id,
          started_at: startedAt,
          ended_at: endedAt,
          duration_seconds: durationSeconds,
          logged_date: loggedDate,
        },
        {
          onConflict: "user_id,card_id,started_at",
          ignoreDuplicates: true,
        },
      );

      if (error) {
        console.error("[useTimeLogs] createTimeLog failed:", error.message);
        return false;
      }

      return true;
    },
    [],
  );

  return { recentLogs, allLogs, loading, fetchRecentLogs, fetchAllLogs, createTimeLog };
}
