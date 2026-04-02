"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "todowallet_today_mode";

/**
 * 오늘 하루 시간 보기 토글
 * localStorage로 전역 동기화 (탭 간에도)
 */
export function useTodayMode() {
  const [todayMode, setTodayMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setTodayMode(true);
  }, []);

  const toggleTodayMode = useCallback(() => {
    setTodayMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // 다른 탭에서 변경 시 동기화
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setTodayMode(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return { todayMode, toggleTodayMode };
}
