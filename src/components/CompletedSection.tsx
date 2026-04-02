"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getPreset } from "@/constants/design-presets";
import { formatDDay } from "@/lib/utils/date";
import type { ProjectCardWithStats } from "@/types";

interface CompletedSectionProps {
  cards: ProjectCardWithStats[];
}

function MiniCompletedCard({ card }: { card: ProjectCardWithStats }) {
  const router = useRouter();
  const preset = getPreset(card.design_preset);
  const dDayText = formatDDay(card.d_day, card.is_completed);

  return (
    <motion.button
      layout
      onClick={() => router.push(`/cards/${card.id}`)}
      className={`pressable w-full rounded-xl overflow-hidden text-left ${preset.patternClass ?? ""}`}
      style={{ background: preset.gradient }}
      whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="px-4 py-3 flex flex-col" style={{ color: preset.textColor }}>
        {/* 제목 + 진행일수 */}
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold truncate flex-1 mr-2">
            {card.title}
          </h4>
          <span className="text-[10px] opacity-60 whitespace-nowrap">
            {card.elapsed_days}일째
          </span>
        </div>

        {/* 총 투자시간 + D-Day */}
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-sm font-bold tracking-tight font-mono tabular-nums">
            {card.total_hours_display}
          </span>
          {dDayText && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                color: preset.textColor,
              }}
            >
              {dDayText}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function CompletedSection({ cards }: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

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
            {cards.map((card) => (
              <MiniCompletedCard key={card.id} card={card} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
