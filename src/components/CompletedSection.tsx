"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getPreset } from "@/constants/design-presets";
import { formatDate } from "@/lib/utils/date";
import type { ProjectCardWithStats } from "@/types";

interface CompletedSectionProps {
  cards: ProjectCardWithStats[];
}

export default function CompletedSection({ cards }: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (cards.length === 0) return null;

  return (
    <div className="mt-8">
      {/* 헤더 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pressable w-full flex items-center justify-between py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">달성한 목표</span>
          <span className="text-xs text-gray-400 font-medium">({cards.length})</span>
        </div>
        <span className="text-xs text-gray-400">
          {isOpen ? "접기 ▴" : "펼치기 ▾"}
        </span>
      </button>

      {/* 구분선 */}
      <div className="border-t border-dashed border-gray-200" />

      {/* 목록 */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {cards.map((card) => {
            const preset = getPreset(card.design_preset);
            return (
              <motion.button
                layout
                key={card.id}
                onClick={() => router.push(`/cards/${card.id}`)}
                className="pressable w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                {/* 컬러 도트 */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: preset.gradient }}
                />

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-emerald-500 shrink-0">✓</span>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {card.title}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0 ml-auto">
                      {card.total_hours_display}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 ml-5">
                    {formatDate(card.created_at)}
                    {card.completed_at && ` ~ ${formatDate(card.completed_at)}`}
                  </p>
                </div>
              </motion.button>
            );
          })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
