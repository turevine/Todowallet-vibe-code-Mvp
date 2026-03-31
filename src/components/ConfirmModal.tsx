"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: "red" | "green";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmColor = "red",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const colorClasses =
    confirmColor === "red"
      ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
      : "bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
          />

          {/* 모달 */}
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center"
            initial={false}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full max-w-[430px] shadow-2xl overflow-hidden pb-2 safe-area-bottom"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-3" />
              <div className="px-6 pt-2 pb-4">
                <h3 className="text-[17px] font-semibold text-gray-900 text-center">
                  {title}
                </h3>
                <p className="text-[14px] text-gray-500 text-center mt-2 leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="border-t border-gray-100" />

              <div className="flex">
                <button
                  onClick={onCancel}
                  className="pressable touch-target flex-1 py-3.5 text-[15px] font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  취소
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={onConfirm}
                  className={`pressable touch-target flex-1 py-3.5 text-[15px] font-semibold text-white ${colorClasses} transition-colors`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
