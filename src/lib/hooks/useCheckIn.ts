"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TimerState, TimerSession } from "@/types";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "todowallet_timer_session";
const supabase = createClient();

type SessionMap = Record<string, TimerSession>;

function loadSessionMap(): SessionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TimerSession | SessionMap;
    if (!parsed || typeof parsed !== "object") return {};
    if ("cardId" in parsed) {
      const legacy = parsed as TimerSession;
      return legacy.cardId ? { [legacy.cardId]: legacy } : {};
    }
    return parsed as SessionMap;
  } catch {
    return {};
  }
}

function saveSessionMap(map: SessionMap) {
  if (Object.keys(map).length === 0) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function loadSession(cardId: string): TimerSession | null {
  return loadSessionMap()[cardId] ?? null;
}

function saveSession(session: TimerSession | null) {
  if (!session) return;
  const map = loadSessionMap();
  map[session.cardId] = session;
  saveSessionMap(map);
}

function removeSession(cardId: string) {
  const map = loadSessionMap();
  delete map[cardId];
  saveSessionMap(map);
}

async function syncRemoteSession(session: TimerSession) {
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession?.user) return;

  const { error } = await supabase
    .from("active_timer_sessions")
    .upsert({
      card_id: session.cardId,
      user_id: authSession.user.id,
      started_at: session.startedAt,
      elapsed_before_pause: session.elapsedBeforePause,
      last_resumed_at: session.lastResumedAt ?? null,
      state: session.state,
      updated_at: new Date().toISOString(),
    }, { onConflict: "card_id" });
  if (error) {
    console.error("[useCheckIn] syncRemoteSession failed:", error.message);
  }
}

async function removeRemoteSession(cardId: string) {
  const { error } = await supabase.from("active_timer_sessions").delete().eq("card_id", cardId);
  if (error) {
    console.error("[useCheckIn] removeRemoteSession failed:", error.message);
  }
}

interface RemoteSessionRow {
  card_id: string;
  started_at: string;
  elapsed_before_pause: number;
  last_resumed_at: string | null;
  state: "running" | "paused";
  updated_at: string;
}

async function loadRemoteSession(cardId: string): Promise<TimerSession | null> {
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession?.user) return null;

  const { data, error } = await supabase
    .from("active_timer_sessions")
    .select("card_id, started_at, elapsed_before_pause, last_resumed_at, state, updated_at")
    .eq("user_id", authSession.user.id)
    .eq("card_id", cardId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as RemoteSessionRow;
  return {
    cardId: row.card_id,
    startedAt: row.started_at,
    elapsedBeforePause: row.elapsed_before_pause,
    lastResumedAt: row.last_resumed_at ?? undefined,
    lastSyncedAt: row.updated_at,
    state: row.state,
  };
}

function sessionTimestamp(session: TimerSession | null): number {
  if (!session) return 0;
  const raw = session.lastSyncedAt ?? session.lastResumedAt ?? session.startedAt;
  const ms = new Date(raw).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function useCheckIn(cardId: string) {
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const elapsedBeforePauseRef = useRef(0);
  const startedAtTimestampRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 현재 경과시간 계산 (정확)
  const computeElapsed = useCallback(() => {
    if (startedAtTimestampRef.current === 0) return elapsedBeforePauseRef.current;
    return Math.floor((Date.now() - startedAtTimestampRef.current) / 1000) + elapsedBeforePauseRef.current;
  }, []);

  // UI 업데이트 타이머 시작
  const startTicking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(computeElapsed());
    }, 1000);
  }, [computeElapsed]);

  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // localStorage 자동저장 시작/중지
  const lastResumedAtRef = useRef<string | undefined>(undefined);

  const startAutoSave = useCallback(() => {
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    saveIntervalRef.current = setInterval(() => {
      const nowISO = new Date().toISOString();
      const session: TimerSession = {
        cardId,
        startedAt: startedAt ?? new Date().toISOString(),
        elapsedBeforePause: computeElapsed(),
        lastResumedAt: lastResumedAtRef.current,
        lastSyncedAt: nowISO,
        state: timerState === "running" ? "running" : "paused",
      };
      saveSession(session);
      void syncRemoteSession(session);
    }, 30000);
  }, [cardId, startedAt, timerState, computeElapsed]);

  const stopAutoSave = useCallback(() => {
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }
  }, []);

  // 마운트 시 기존 세션 자동 복구
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const recover = (session: TimerSession) => {
      const now = Date.now();
      const nowISO = new Date(now).toISOString();

      if (session.state === "running") {
        let totalElapsed: number;
        if (session.lastSyncedAt) {
          const syncedMs = new Date(session.lastSyncedAt).getTime();
          totalElapsed = session.elapsedBeforePause + Math.floor((now - syncedMs) / 1000);
        } else if (session.lastResumedAt) {
          const resumedMs = new Date(session.lastResumedAt).getTime();
          totalElapsed = session.elapsedBeforePause + Math.floor((now - resumedMs) / 1000);
        } else {
          const sessionSaveTime = new Date(session.startedAt).getTime();
          totalElapsed = Math.floor((now - sessionSaveTime) / 1000);
        }
        elapsedBeforePauseRef.current = totalElapsed;
        startedAtTimestampRef.current = now;
        lastResumedAtRef.current = nowISO;
        setStartedAt(session.startedAt);
        setElapsedSeconds(totalElapsed);
        setTimerState("running");
        const normalized: TimerSession = {
          cardId,
          startedAt: session.startedAt,
          elapsedBeforePause: totalElapsed,
          lastResumedAt: nowISO,
          lastSyncedAt: nowISO,
          state: "running",
        };
        saveSession(normalized);
        void syncRemoteSession(normalized);
        startTicking();
      } else {
        elapsedBeforePauseRef.current = session.elapsedBeforePause;
        startedAtTimestampRef.current = 0;
        lastResumedAtRef.current = undefined;
        setStartedAt(session.startedAt);
        setElapsedSeconds(session.elapsedBeforePause);
        setTimerState("paused");
      }
    };

    void (async () => {
      const localSession = loadSession(cardId);
      const remoteSession = await loadRemoteSession(cardId);

      const candidateLocal = localSession && localSession.state !== "idle" ? localSession : null;
      const candidateRemote = remoteSession && remoteSession.state !== "idle" ? remoteSession : null;
      const bestSession =
        sessionTimestamp(candidateRemote) > sessionTimestamp(candidateLocal)
          ? candidateRemote
          : candidateLocal;

      if (!bestSession) return;
      recover(bestSession);
    })();
  }, [cardId, startTicking]);

  // 클린업
  useEffect(() => {
    return () => {
      stopTicking();
      stopAutoSave();
    };
  }, [stopTicking, stopAutoSave]);

  // timerState 변경 시 autosave 갱신
  useEffect(() => {
    if (timerState === "running" || timerState === "paused") {
      startAutoSave();
    } else {
      stopAutoSave();
    }
  }, [timerState, startAutoSave, stopAutoSave]);

  const checkIn = useCallback(() => {
    const now = new Date();
    const nowTs = now.getTime();
    const nowISO = now.toISOString();

    elapsedBeforePauseRef.current = 0;
    startedAtTimestampRef.current = nowTs;
    lastResumedAtRef.current = nowISO;
    setStartedAt(nowISO);
    setElapsedSeconds(0);
    setTimerState("running");

    saveSession({ cardId, startedAt: nowISO, elapsedBeforePause: 0, lastResumedAt: nowISO, lastSyncedAt: nowISO, state: "running" });
    void syncRemoteSession({ cardId, startedAt: nowISO, elapsedBeforePause: 0, lastResumedAt: nowISO, lastSyncedAt: nowISO, state: "running" });
    startTicking();
  }, [cardId, startTicking]);

  const pause = useCallback(() => {
    const elapsed = computeElapsed();
    elapsedBeforePauseRef.current = elapsed;
    startedAtTimestampRef.current = 0;
    lastResumedAtRef.current = undefined;
    setElapsedSeconds(elapsed);
    setTimerState("paused");
    stopTicking();

    const nowISO = new Date().toISOString();
    const session = { cardId, startedAt: startedAt ?? "", elapsedBeforePause: elapsed, lastResumedAt: undefined, lastSyncedAt: nowISO, state: "paused" as const };
    saveSession(session);
    void syncRemoteSession(session);
  }, [cardId, startedAt, computeElapsed, stopTicking]);

  const resume = useCallback(() => {
    const nowTs = Date.now();
    const nowISO = new Date(nowTs).toISOString();
    startedAtTimestampRef.current = nowTs;
    lastResumedAtRef.current = nowISO;
    setTimerState("running");

    const session = {
      cardId,
      startedAt: startedAt ?? nowISO,
      elapsedBeforePause: elapsedBeforePauseRef.current,
      lastResumedAt: nowISO,
      lastSyncedAt: nowISO,
      state: "running",
    } as const;
    saveSession(session);
    void syncRemoteSession(session);
    startTicking();
  }, [cardId, startedAt, startTicking]);

  const checkOut = useCallback((): { saved: boolean; duration: number; startedAt: string; endedAt: string } => {
    const duration = computeElapsed();
    const endedAt = new Date().toISOString();
    const checkInStartedAt = startedAt ?? new Date().toISOString();

    stopTicking();
    stopAutoSave();
    elapsedBeforePauseRef.current = 0;
    startedAtTimestampRef.current = 0;
    lastResumedAtRef.current = undefined;
    setElapsedSeconds(0);
    setStartedAt(null);
    setTimerState("idle");
    removeSession(cardId);
    void removeRemoteSession(cardId);

    return {
      saved: duration >= 60,
      duration,
      startedAt: checkInStartedAt,
      endedAt,
    };
  }, [computeElapsed, startedAt, stopTicking, stopAutoSave]);

  return {
    timerState,
    elapsedSeconds,
    startedAt,
    checkIn,
    pause,
    resume,
    checkOut,
  };
}
