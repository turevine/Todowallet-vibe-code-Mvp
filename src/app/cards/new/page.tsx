"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import DesignPresetPicker from "@/components/DesignPresetPicker";
import ProjectCard from "@/components/ProjectCard";
import { useCards } from "@/lib/hooks/useCards";
import { useToast } from "@/lib/hooks/useToast";
import { DEFAULT_PRESET_ID } from "@/constants/design-presets";
import { calculateDDay, calculateElapsedDays, getToday } from "@/lib/utils/date";
import { formatTotalTime } from "@/lib/utils/format";
import type { ProjectCardWithStats } from "@/types";

function NewCardContent() {
  const router = useRouter();
  const { createCard } = useCards();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [targetHours, setTargetHours] = useState(1);
  const [targetMinutes, setTargetMinutes] = useState(0);
  const [designPreset, setDesignPreset] = useState(DEFAULT_PRESET_ID);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const today = getToday();
  const now = new Date().toISOString();

  const previewCard: ProjectCardWithStats = {
    id: "preview",
    user_id: "",
    title: title || "목표를 입력하세요",
    deadline: deadline || null,
    design_preset: designPreset,
    target_seconds: targetHours * 3600 + targetMinutes * 60,
    display_order: 0,
    is_completed: false,
    completed_at: null,
    is_deleted: false,
    deleted_at: null,
    created_at: now,
    updated_at: now,
    total_seconds: 0,
    d_day: calculateDDay(deadline || null),
    elapsed_days: calculateElapsedDays(now),
    total_hours_display: formatTotalTime(0),
  };

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const targetSeconds = targetHours * 3600 + targetMinutes * 60;
      const success = await createCard(title.trim(), deadline || null, designPreset, targetSeconds || 3600);
      if (success) {
        showToast("카드가 생성되었습니다", "success");
        router.replace("/home?new=1");
      } else {
        setError("카드 생성에 실패했습니다. 다시 시도해주세요.");
        showToast("카드 생성에 실패했습니다", "error");
        setSubmitting(false);
      }
    } catch (e) {
      console.error("[NewCard] handleSubmit error:", e);
      setError("오류가 발생했습니다. 다시 시도해주세요.");
      showToast("오류가 발생했습니다. 다시 시도해주세요.", "error");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col min-h-screen bg-white"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* 헤더 */}
      <header className="flex items-center px-5 pt-14 pb-4">
        <button
          onClick={() => router.back()}
          className="pressable touch-target w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      {/* 폼 — 태블릿에서 필드는 셸 폭 활용, 미리보기 카드만 430px */}
      <main className="flex-1 px-5 pb-8 md:max-w-2xl md:mx-auto md:w-full">
        {/* 목표 이름 */}
        <section className="mb-7">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            목표 이름
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 30))}
            placeholder="목표를 입력하세요"
            className="w-full h-[48px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
          />
          <p className="text-[11px] text-gray-400 mt-1 text-right">
            {title.length}/30
          </p>
        </section>

        {/* 마감일 */}
        <section className="mb-7">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            마감일
            <span className="text-xs font-normal text-gray-400 ml-1.5">선택</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={today}
            className="w-full h-[48px] px-4 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-gray-400 transition-colors"
          />
          {deadline && (
            <button
              type="button"
              onClick={() => setDeadline("")}
              className="text-[12px] text-gray-400 hover:text-gray-600 mt-1.5 ml-1"
            >
              마감일 없이 진행하기
            </button>
          )}
        </section>

        {/* 일일 목표 시간 */}
        <section className="mb-7">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            일일 목표 시간
          </label>
          <p className="text-[11px] text-gray-400 mb-2">
            히트맵 색상 기준이 됩니다
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={23}
                value={targetHours}
                onChange={(e) => setTargetHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-[64px] h-[48px] px-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 text-center outline-none focus:border-gray-400 transition-colors"
              />
              <span className="text-sm text-gray-500">시간</span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={59}
                step={10}
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-[64px] h-[48px] px-3 bg-gray-50 border border-gray-200 rounded-xl text-[15px] text-gray-900 text-center outline-none focus:border-gray-400 transition-colors"
              />
              <span className="text-sm text-gray-500">분</span>
            </div>
          </div>
        </section>

        {/* 카드 디자인 */}
        <section className="mb-7">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            카드 디자인
          </label>
          <DesignPresetPicker
            selectedId={designPreset}
            onSelect={setDesignPreset}
          />
        </section>

        {/* 실시간 미리보기 */}
        <section className="mb-8">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            미리보기
          </label>
          <div className="pointer-events-none card-column">
            <ProjectCard card={previewCard} isFront />
          </div>
        </section>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-[13px] text-red-500 text-center mb-3">{error}</p>
        )}

        {/* 발급 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className="pressable touch-target w-full h-[52px] bg-gray-900 rounded-xl text-[15px] font-semibold text-white hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              발급 중...
            </>
          ) : "카드 발급받기"}
        </button>
      </main>
    </motion.div>
  );
}

export default function NewCardPage() {
  return (
    <AuthGuard>
      <NewCardContent />
    </AuthGuard>
  );
}
