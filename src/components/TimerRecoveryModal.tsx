"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TimerSession } from "@/types";

interface TimerRecoveryModalProps {
  session: TimerSession;
  onRecover: () => void;
  onDiscard: () => void;
}

export default function TimerRecoveryModal({
  session,
  onRecover,
  onDiscard,
}: TimerRecoveryModalProps) {
  const minutes = Math.floor(session.elapsedBeforePause / 60);
  const label = minutes < 1 ? "1분 미만" : `약 ${minutes}분`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/40 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <motion.div
          className="bg-white rounded-t-3xl w-full max-w-app-card p-6 shadow-xl safe-area-bottom"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-0 mb-4" />
          <h3 className="text-base font-semibold text-gray-900 mb-2 text-center">
            이전 세션이 있습니다
          </h3>
          <p className="text-sm text-gray-500 mb-6 text-center">
            진행 중이던 기록이 있습니다 ({label}).
            <br />
            이어서 할까요?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onDiscard}
              className="pressable touch-target flex-1 h-[44px] rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              버리기
            </button>
            <button
              onClick={onRecover}
              className="pressable touch-target flex-1 h-[44px] rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-700 transition-colors"
            >
              이어서 기록
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
