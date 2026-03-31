"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DesignPresetPicker from "@/components/DesignPresetPicker";
import type { ProjectCardWithStats } from "@/types";

interface CardEditMenuProps {
  card: ProjectCardWithStats;
  onDelete: () => void;
  onChangeDesign?: (id: string, preset: string) => Promise<void>;
}

type SheetState = "closed" | "menu" | "design";

export default function CardEditMenu({
  card,
  onDelete,
  onChangeDesign,
}: CardEditMenuProps) {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>("closed");

  const close = useCallback(() => setSheet("closed"), []);

  const handleDesignSelect = useCallback(
    async (presetId: string) => {
      await onChangeDesign?.(card.id, presetId);
      setSheet("closed");
    },
    [card.id, onChangeDesign],
  );

  return (
    <>
      {/* 트리거 버튼 */}
      <div className="flex justify-center mt-3">
        <button
          onClick={() => setSheet("menu")}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-50 active:bg-gray-100"
        >
          편집 ···
        </button>
      </div>

      <AnimatePresence>
        {sheet !== "closed" && (
          <>
            {/* 오버레이 */}
            <motion.div
              className="fixed inset-0 bg-black/30 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* 바텀시트 */}
            <motion.div
              className="fixed bottom-0 left-1/2 w-full max-w-[430px] bg-white rounded-t-2xl z-50 pb-8"
              style={{ x: "-50%" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

              {sheet === "menu" && (
                <div className="px-5 py-2 space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 px-3 py-2">
                    {card.title}
                  </h4>

                  <button
                    onClick={() => setSheet("design")}
                    className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <span className="text-lg">🎨</span>
                    <span className="text-[15px] text-gray-700">카드 바꾸기</span>
                  </button>

                  <button
                    onClick={() => {
                      close();
                      router.push(`/cards/${card.id}`);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <span className="text-lg">✏️</span>
                    <span className="text-[15px] text-gray-700">카드 편집하기</span>
                  </button>

                  <button
                    onClick={() => {
                      close();
                      onDelete();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors text-left"
                  >
                    <span className="text-lg">🗑️</span>
                    <span className="text-[15px] text-red-500">카드 삭제하기</span>
                  </button>
                </div>
              )}

              {sheet === "design" && (
                <div className="px-5 py-2">
                  <div className="flex items-center gap-2 px-1 mb-4">
                    <button
                      onClick={() => setSheet("menu")}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <h4 className="text-sm font-semibold text-gray-900">
                      디자인 선택
                    </h4>
                  </div>
                  <DesignPresetPicker
                    selectedId={card.design_preset}
                    onSelect={handleDesignSelect}
                  />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
