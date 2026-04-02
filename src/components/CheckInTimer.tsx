"use client";

import { useEffect, useRef } from "react";
import { useCheckIn } from "@/lib/hooks/useCheckIn";
import { useTimeLogs } from "@/lib/hooks/useTimeLogs";
import { useToast } from "@/lib/hooks/useToast";

interface CheckInTimerProps {
  cardId: string;
  isCompleted: boolean;
  onTimeLogCreated: () => void;
  onComplete: () => void;
  onTimerStateChange?: (state: "idle" | "running" | "paused") => void;
}

export default function CheckInTimer({
  cardId,
  isCompleted,
  onTimeLogCreated,
  onComplete,
  onTimerStateChange,
}: CheckInTimerProps) {
  const {
    timerState,
    checkIn,
    pause,
    resume,
    checkOut,
  } = useCheckIn(cardId);

  useEffect(() => {
    onTimerStateChange?.(timerState);
  }, [timerState, onTimerStateChange]);

  const { createTimeLog } = useTimeLogs();
  const { showToast } = useToast();
  const isCheckingOutRef = useRef(false);

  const handleCheckOut = async () => {
    if (isCheckingOutRef.current) return;
    isCheckingOutRef.current = true;
    const result = checkOut();
    if (!result.saved) {
      showToast("1분 이상 기록해야 저장됩니다", "warning");
      isCheckingOutRef.current = false;
      return;
    }
    const created = await createTimeLog(cardId, result.startedAt, result.endedAt, result.duration);
    if (created) {
      showToast("기록이 저장되었습니다", "success");
      onTimeLogCreated();
    } else {
      showToast("기록 저장에 실패했어요. 잠시 후 다시 시도해주세요", "error");
    }
    isCheckingOutRef.current = false;
  };

  if (isCompleted) return null;

  return (
    <div>
      {timerState === "idle" && (
        <div className="space-y-3">
          <button
            onClick={checkIn}
            className="pressable touch-target w-full h-[52px] bg-gray-900 rounded-xl text-[15px] font-semibold text-white hover:bg-gray-800 active:bg-gray-700 transition-colors"
          >
            체크인
          </button>
          <button
            onClick={onComplete}
            className="pressable touch-target w-full h-[44px] border border-gray-200 rounded-xl text-[15px] font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            ✓ 목표 달성
          </button>
        </div>
      )}

      {timerState === "running" && (
        <div className="flex gap-3">
          <button
            onClick={pause}
            className="pressable touch-target w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
          <button
            onClick={handleCheckOut}
            className="pressable touch-target flex-1 h-14 bg-red-500 rounded-xl text-[15px] font-semibold text-white hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            체크아웃
          </button>
        </div>
      )}

      {timerState === "paused" && (
        <div className="flex gap-3">
          <button
            onClick={resume}
            className="pressable touch-target w-14 h-14 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#333">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button
            onClick={handleCheckOut}
            className="pressable touch-target flex-1 h-14 bg-red-500 rounded-xl text-[15px] font-semibold text-white hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            체크아웃
          </button>
        </div>
      )}
    </div>
  );
}
