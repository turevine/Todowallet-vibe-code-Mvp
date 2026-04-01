"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

export interface DailyLog {
  date: string;        // YYYY-MM-DD
  totalSeconds: number;
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
      .select("logged_date, duration_seconds")
      .eq("card_id", cardId)
      .order("logged_date", { ascending: false });

    if (data) {
      const map = new Map<string, number>();
      data.forEach((row) => {
        map.set(row.logged_date, (map.get(row.logged_date) ?? 0) + row.duration_seconds);
      });
      const logs = Array.from(map.entries())
        .map(([date, totalSeconds]) => ({ date, totalSeconds }))
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
      .select("logged_date, duration_seconds")
      .eq("card_id", cardId)
      .order("logged_date", { ascending: false });

    if (data) {
      const map = new Map<string, number>();
      data.forEach((row) => {
        map.set(row.logged_date, (map.get(row.logged_date) ?? 0) + row.duration_seconds);
      });
      const logs = Array.from(map.entries())
        .map(([date, totalSeconds]) => ({ date, totalSeconds }))
        .sort((a, b) => b.date.localeCompare(a.date));
      setAllLogs(logs);
    }
    setLoading(false);
  }, []);

  const createTimeLog = useCallback(
    async (cardId: string, startedAt: string, endedAt: string, durationSeconds: number) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const loggedDate = format(new Date(startedAt), "yyyy-MM-dd");

      await supabase.from("time_logs").insert({
        card_id: cardId,
        user_id: user.id,
        started_at: startedAt,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        logged_date: loggedDate,
      });
    },
    [],
  );

  return { recentLogs, allLogs, loading, fetchRecentLogs, fetchAllLogs, createTimeLog };
}
