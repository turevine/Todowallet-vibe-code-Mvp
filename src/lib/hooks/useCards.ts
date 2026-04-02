"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateDDay, calculateElapsedDays } from "@/lib/utils/date";
import { formatTotalTime } from "@/lib/utils/format";
import type { ProjectCard, ProjectCardWithStats } from "@/types";

const TIMER_STORAGE_KEY = "todowallet_timer_session";

interface LiveTimerSession {
  cardId: string;
  startedAt: string;
  elapsedBeforePause: number;
  lastResumedAt?: string;
  lastSyncedAt?: string;
  state: "running" | "paused" | "idle";
}

type LiveTimerSessionMap = Record<string, LiveTimerSession>;

interface RemoteLiveTimerRow {
  card_id: string;
  started_at: string;
  elapsed_before_pause: number;
  last_resumed_at: string | null;
  updated_at: string;
  state: "running" | "paused";
}

/** 세션이 이 시간(초) 이상 동기화 없이 running이면 고스트로 판단 */
const STALE_THRESHOLD_SECONDS = 3 * 60 * 60; // 3시간

function isStaleTimerSession(session: LiveTimerSession, now: number): boolean {
  if (session.state !== "running") return false;
  const lastTs = new Date(session.lastSyncedAt ?? session.lastResumedAt ?? session.startedAt).getTime();
  if (Number.isNaN(lastTs) || lastTs === 0) return true;
  return (now - lastTs) / 1000 > STALE_THRESHOLD_SECONDS;
}

function enrichCard(card: ProjectCard & { total_seconds: number }): ProjectCardWithStats {
  return {
    ...card,
    d_day: calculateDDay(card.deadline),
    elapsed_days: calculateElapsedDays(card.created_at),
    total_hours_display: formatTotalTime(card.total_seconds),
  };
}

function parseRows(data: Record<string, unknown>[]): ProjectCardWithStats[] {
  return data.map((row) => {
    const logs = ((row.time_logs as { duration_seconds: number }[]) ?? []);
    const total_seconds = logs.reduce((sum, l) => sum + l.duration_seconds, 0);
    const card = { ...row };
    delete card.time_logs;
    return enrichCard({ ...card, total_seconds } as ProjectCard & { total_seconds: number });
  });
}

async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    console.error("[useCards] getUserId failed:", error?.message ?? "no session");
    return null;
  }
  return session.user.id;
}

export function useCards() {
  const [activeCards, setActiveCards] = useState<ProjectCardWithStats[]>([]);
  const [completedCards, setCompletedCards] = useState<ProjectCardWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [localLiveTimerSessions, setLocalLiveTimerSessions] = useState<LiveTimerSessionMap>({});
  const [remoteLiveTimerSessions, setRemoteLiveTimerSessions] = useState<LiveTimerSessionMap>({});
  const [liveNow, setLiveNow] = useState(Date.now());

  const readLiveSession = useCallback(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) {
        setLocalLiveTimerSessions({});
        return;
      }
      const parsed = JSON.parse(raw) as LiveTimerSession | LiveTimerSessionMap;
      if (!parsed || typeof parsed !== "object") {
        setLocalLiveTimerSessions({});
        return;
      }

      // Backward compatibility: single-session object
      if ("cardId" in parsed) {
        const single = parsed as LiveTimerSession;
        if (!single.cardId || single.state === "idle") {
          setLocalLiveTimerSessions({});
          return;
        }
        setLocalLiveTimerSessions({ [single.cardId]: single });
        return;
      }

      const map = parsed as LiveTimerSessionMap;
      const filtered = Object.fromEntries(
        Object.entries(map).filter(([, s]) => s?.cardId && s.state !== "idle"),
      ) as LiveTimerSessionMap;
      setLocalLiveTimerSessions(filtered);
    } catch {
      setLocalLiveTimerSessions({});
    }
  }, []);

  const readRemoteSessions = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) {
      setRemoteLiveTimerSessions({});
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("active_timer_sessions")
      .select("card_id, started_at, elapsed_before_pause, last_resumed_at, updated_at, state")
      .eq("user_id", userId);

    if (error || !data) {
      if (error) {
        console.error("[useCards] readRemoteSessions failed:", error.message);
      }
      setRemoteLiveTimerSessions({});
      return;
    }

    const mapped = Object.fromEntries(
      (data as RemoteLiveTimerRow[]).map((row) => [
        row.card_id,
        {
          cardId: row.card_id,
          startedAt: row.started_at,
          elapsedBeforePause: row.elapsed_before_pause,
          lastResumedAt: row.last_resumed_at ?? undefined,
          lastSyncedAt: row.updated_at,
          state: row.state,
        } satisfies LiveTimerSession,
      ]),
    ) as LiveTimerSessionMap;

    setRemoteLiveTimerSessions(mapped);
  }, []);

  const fetchActiveCards = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("project_cards")
      .select("*, time_logs(duration_seconds)")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .eq("is_deleted", false)
      .order("display_order", { ascending: false });

    if (error) {
      console.error("[useCards] fetchActiveCards error:", error.message);
      return;
    }
    if (data) setActiveCards(parseRows(data as Record<string, unknown>[]));
  }, []);

  const fetchCompletedCards = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("project_cards")
      .select("*, time_logs(duration_seconds)")
      .eq("user_id", userId)
      .eq("is_completed", true)
      .eq("is_deleted", false)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("[useCards] fetchCompletedCards error:", error.message);
      return;
    }
    if (data) setCompletedCards(parseRows(data as Record<string, unknown>[]));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchActiveCards(), fetchCompletedCards()]);
    } finally {
      setLoading(false);
    }
  }, [fetchActiveCards, fetchCompletedCards]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    readLiveSession();
    void readRemoteSessions();
    const intervalId = window.setInterval(() => {
      setLiveNow(Date.now());
      readLiveSession();
    }, 1000);
    const remoteIntervalId = window.setInterval(() => {
      void readRemoteSessions();
    }, 3000);

    const handleStorage = () => {
      readLiveSession();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.clearInterval(intervalId);
      window.clearInterval(remoteIntervalId);
      window.removeEventListener("storage", handleStorage);
    };
  }, [readLiveSession, readRemoteSessions]);

  const activeCardsWithLive = useMemo(() => {
    const mergedLiveSessions: LiveTimerSessionMap = { ...remoteLiveTimerSessions };
    for (const [cardId, localSession] of Object.entries(localLiveTimerSessions)) {
      const remoteSession = mergedLiveSessions[cardId];
      if (!remoteSession) {
        mergedLiveSessions[cardId] = localSession;
        continue;
      }
      const localTs = new Date(localSession.lastSyncedAt ?? localSession.lastResumedAt ?? localSession.startedAt).getTime();
      const remoteTs = new Date(remoteSession.lastSyncedAt ?? remoteSession.lastResumedAt ?? remoteSession.startedAt).getTime();
      mergedLiveSessions[cardId] = localTs >= remoteTs ? localSession : remoteSession;
    }

    // 고스트 세션 필터링: 너무 오래된 running 세션은 무시
    const now = Date.now();
    for (const [cardId, session] of Object.entries(mergedLiveSessions)) {
      if (isStaleTimerSession(session, now)) {
        delete mergedLiveSessions[cardId];
      }
    }

    if (Object.keys(mergedLiveSessions).length === 0) return activeCards;

    return activeCards.map((card) => {
      const liveTimerSession = mergedLiveSessions[card.id];
      if (!liveTimerSession) return card;

      let liveElapsed: number;
      if (liveTimerSession.state === "running" && liveTimerSession.lastSyncedAt) {
        const syncedMs = new Date(liveTimerSession.lastSyncedAt).getTime();
        const sinceLast = Math.max(0, Math.floor((liveNow - syncedMs) / 1000));
        liveElapsed = liveTimerSession.elapsedBeforePause + sinceLast;
      } else {
        liveElapsed = Math.max(0, liveTimerSession.elapsedBeforePause);
      }

      const totalWithLive = card.total_seconds + liveElapsed;
      return {
        ...card,
        total_seconds: totalWithLive,
        total_hours_display: formatTotalTime(totalWithLive),
        is_live_running: liveTimerSession.state === "running",
        live_elapsed_seconds: liveElapsed,
      };
    });
  }, [activeCards, liveNow, localLiveTimerSessions, remoteLiveTimerSessions]);

  const createCard = useCallback(
    async (title: string, deadline: string | null, designPreset: string, targetSeconds?: number): Promise<boolean> => {
      const userId = await getUserId();
      if (!userId) return false;

      const supabase = createClient();
      const { data: rows } = await supabase
        .from("project_cards")
        .select("display_order")
        .eq("user_id", userId)
        .eq("is_completed", false)
        .eq("is_deleted", false)
        .order("display_order", { ascending: false })
        .limit(1);

      const maxOrder = (rows && rows.length > 0)
        ? (rows[0] as { display_order: number }).display_order
        : 0;

      const { error } = await supabase.from("project_cards").insert({
        user_id: userId,
        title,
        deadline,
        design_preset: designPreset,
        target_seconds: targetSeconds ?? 3600,
        display_order: maxOrder + 1,
      });

      if (error) {
        console.error("[useCards] createCard insert error:", error.message, error);
        return false;
      }

      await refresh();
      return true;
    },
    [refresh],
  );

  const updateCard = useCallback(
    async (id: string, updates: Partial<Pick<ProjectCard, "title" | "deadline" | "design_preset" | "target_seconds">>) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_cards")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) await refresh();
    },
    [refresh],
  );

  const updateCardOrder = useCallback(
    async (cards: { id: string; display_order: number }[]) => {
      const supabase = createClient();
      const promises = cards.map((c) =>
        supabase
          .from("project_cards")
          .update({ display_order: c.display_order, updated_at: new Date().toISOString() })
          .eq("id", c.id),
      );
      await Promise.all(promises);
      await refresh();
    },
    [refresh],
  );

  const completeCard = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_cards")
        .update({ is_completed: true, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) await refresh();
    },
    [refresh],
  );

  const uncompleteCard = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_cards")
        .update({ is_completed: false, completed_at: null, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) await refresh();
    },
    [refresh],
  );

  const softDeleteCard = useCallback(
    async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_cards")
        .update({ is_deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", id);
      if (!error) await refresh();
    },
    [refresh],
  );

  const hardDeleteCard = useCallback(
    async (id: string) => {
      const supabase = createClient();
      await supabase.from("time_logs").delete().eq("card_id", id);
      const { error } = await supabase.from("project_cards").delete().eq("id", id);
      if (!error) await refresh();
    },
    [refresh],
  );

  const restoreCard = useCallback(
    async (id: string): Promise<"restored" | "already_deleted" | "error"> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("project_cards")
        .update({ is_deleted: false, deleted_at: null, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("is_deleted", true)
        .select("id");
      if (error) return "error";
      if (!data || data.length === 0) return "already_deleted";
      await refresh();
      return "restored";
    },
    [refresh],
  );

  const fetchDeletedCards = useCallback(async () => {
    const userId = await getUserId();
    if (!userId) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from("project_cards")
      .select("*, time_logs(duration_seconds)")
      .eq("user_id", userId)
      .eq("is_deleted", true)
      .order("deleted_at", { ascending: false });

    if (!data) return [];
    return parseRows(data as Record<string, unknown>[]);
  }, []);

  return {
    activeCards: activeCardsWithLive,
    completedCards,
    loading,
    refresh,
    createCard,
    updateCard,
    updateCardOrder,
    completeCard,
    uncompleteCard,
    softDeleteCard,
    hardDeleteCard,
    restoreCard,
    fetchDeletedCards,
  };
}
