"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ProjectCard from "@/components/ProjectCard";
import SwipeableCard from "@/components/SwipeableCard";
import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/lib/hooks/useToast";
import type { ProjectCardWithStats } from "@/types";

interface CardStackProps {
  cards: ProjectCardWithStats[];
  onComplete?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdateDesign?: (id: string, preset: string) => Promise<void>;
  newCardEntry?: boolean;
  onCardOpenStart?: (id: string) => void;
}

type ModalState =
  | { type: "none" }
  | { type: "delete"; card: ProjectCardWithStats }
  | { type: "complete"; card: ProjectCardWithStats };

export default function CardStack({
  cards,
  onComplete,
  onDelete,
  onUpdateDesign,
  newCardEntry = false,
  onCardOpenStart,
}: CardStackProps) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const { showToast } = useToast();
  const [openingCardId, setOpeningCardId] = useState<string | null>(null);

  const handleSwipeLeft = useCallback(
    (card: ProjectCardWithStats) => {
      setModal({ type: "delete", card });
    },
    [],
  );

  const handleSwipeRight = useCallback(
    (card: ProjectCardWithStats) => {
      setModal({ type: "complete", card });
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    if (modal.type === "delete") {
      await onDelete?.(modal.card.id);
      showToast("휴지통으로 이동했습니다", "default");
    } else if (modal.type === "complete") {
      await onComplete?.(modal.card.id);
      showToast("목표를 달성했습니다! 🎉", "success");
    }
    setModal({ type: "none" });
  }, [modal, onDelete, onComplete, showToast]);

  const handleCancel = useCallback(() => {
    setModal({ type: "none" });
  }, []);

  const handleOpenCard = useCallback((id: string) => {
    if (openingCardId) return;
    onCardOpenStart?.(id);
    setOpeningCardId(id);
    window.setTimeout(() => {
      router.push(`/cards/${id}`);
    }, 230);
  }, [onCardOpenStart, openingCardId, router]);

  if (cards.length === 0) return null;

  return (
    <>
      <div
        className="relative"
        style={{ paddingTop: `${Math.max(0, (cards.length - 1)) * 64}px` }}
      >
        <AnimatePresence initial={false}>
          {cards.map((card, index) => {
            const isFront = index === 0;
            const isOpening = openingCardId === card.id;
            const isWaiting = !!openingCardId && !isOpening;

            return (
              <motion.div
                key={card.id}
                layout
                initial={newCardEntry && isFront
                  ? { opacity: 0, y: -26, scale: 0.92 }
                  : { opacity: 0, y: 18, scale: 0.98 }}
                animate={{
                  opacity: isOpening ? 1 : isWaiting ? 0.72 : 1,
                  y: isOpening ? -22 : isWaiting ? 16 : 0,
                  scale: isOpening ? 1.015 : 1,
                }}
                exit={{ opacity: 0, y: -18, scale: 0.98 }}
                transition={{ duration: 0.22 }}
                className="transition-all duration-200"
                style={{
                  position: isFront ? "relative" : "absolute",
                  top: isFront ? 0 : (cards.length - 1 - index) * 64,
                  left: 0,
                  right: 0,
                  zIndex: isOpening ? 100 : cards.length - index,
                }}
              >
                <SwipeableCard
                  onSwipeLeft={() => handleSwipeLeft(card)}
                  onSwipeRight={() => handleSwipeRight(card)}
                  onTap={() => handleOpenCard(card.id)}
                  enabled={!openingCardId}
                >
                  <div className={`relative ${openingCardId ? "pointer-events-none" : ""}`}>
                    <ProjectCard card={card} isFront={isFront} />
                    {!isFront && (
                      <div
                        className="absolute bottom-0 left-0 right-0 pointer-events-none rounded-b-2xl"
                        style={{
                          height: "60%",
                          background: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.15) 100%)",
                        }}
                      />
                    )}
                  </div>
                </SwipeableCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={modal.type === "delete"}
        title="카드 삭제"
        description={
          modal.type === "delete"
            ? `'${modal.card.title}' 카드와 모든 기록을 삭제합니다. 휴지통에 30일 보관됩니다.`
            : ""
        }
        confirmLabel="삭제하기"
        confirmColor="red"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* 완료 확인 모달 */}
      <ConfirmModal
        isOpen={modal.type === "complete"}
        title="목표 달성"
        description={
          modal.type === "complete"
            ? `'${modal.card.title}' 목표를 달성 처리할까요?`
            : ""
        }
        confirmLabel="달성!"
        confirmColor="green"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
