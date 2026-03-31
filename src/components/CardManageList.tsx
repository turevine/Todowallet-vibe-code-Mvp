"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getPreset } from "@/constants/design-presets";
import ConfirmModal from "@/components/ConfirmModal";
import type { ProjectCardWithStats } from "@/types";

/* ── 드래그 핸들 아이콘 ── */
function DragHandle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4h8M4 8h8M4 12h8" stroke="#999" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── 삭제 아이콘 ── */
function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-.867 12.142A2 2 0 0116.138 20H7.862a2 2 0 01-1.995-1.858L5 6" />
    </svg>
  );
}

/* ── 완료 체크 아이콘 ── */
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── 정렬 가능한 활성 카드 아이템 ── */
function SortableCardItem({
  card,
  onDelete,
  onTap,
}: {
  card: ProjectCardWithStats;
  onDelete: (card: ProjectCardWithStats) => void;
  onTap: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const preset = getPreset(card.design_preset);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border transition-shadow ${
        isDragging ? "shadow-lg border-gray-300 z-10" : "border-gray-100"
      }`}
    >
      {/* 드래그 핸들 */}
      <button
        className="touch-none flex-shrink-0 p-1 -ml-1 cursor-grab active:cursor-grabbing touch-target"
        {...attributes}
        {...listeners}
      >
        <DragHandle />
      </button>

      {/* 프리셋 컬러 원 + 제목 */}
      <button
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={() => onTap(card.id)}
      >
        <div
          className="w-5 h-5 rounded-full flex-shrink-0"
          style={{ background: preset.gradient }}
        />
        <span className="text-[15px] text-gray-900 truncate">{card.title}</span>
      </button>

      {/* 삭제 버튼 */}
      <button
        onClick={() => onDelete(card)}
        className="pressable touch-target flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 active:text-red-500 transition-colors"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

/* ── 완료 카드 아이템 (드래그 없음) ── */
function CompletedCardItem({
  card,
  onDelete,
  onTap,
}: {
  card: ProjectCardWithStats;
  onDelete: (card: ProjectCardWithStats) => void;
  onTap: (id: string) => void;
}) {
  const preset = getPreset(card.design_preset);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-100 shadow-sm">
      {/* 체크 아이콘 (드래그 핸들 대신) */}
      <div className="flex-shrink-0 p-1 -ml-1">
        <CheckIcon color={preset.accentColor} />
      </div>

      {/* 프리셋 컬러 원 + 제목 */}
      <button
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={() => onTap(card.id)}
      >
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 opacity-50"
          style={{ background: preset.gradient }}
        />
        <span className="text-[15px] text-gray-400 truncate line-through">
          {card.title}
        </span>
      </button>

      {/* 삭제 버튼 */}
      <button
        onClick={() => onDelete(card)}
        className="pressable touch-target flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 active:text-red-500 transition-colors"
      >
        <TrashIcon />
      </button>
    </div>
  );
}

/* ── 드래그 오버레이 아이템 ── */
function DragOverlayItem({ card }: { card: ProjectCardWithStats }) {
  const preset = getPreset(card.design_preset);

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-gray-300 shadow-xl scale-[1.01]">
      <div className="flex-shrink-0 p-1 -ml-1">
        <DragHandle />
      </div>
      <div
        className="w-5 h-5 rounded-full flex-shrink-0"
        style={{ background: preset.gradient }}
      />
      <span className="text-[15px] text-gray-900 truncate">{card.title}</span>
    </div>
  );
}

/* ── 섹션 제목 ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
interface CardManageListProps {
  activeCards: ProjectCardWithStats[];
  completedCards: ProjectCardWithStats[];
  onReorder: (cards: { id: string; display_order: number }[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function CardManageList({
  activeCards,
  completedCards,
  onReorder,
  onDelete,
}: CardManageListProps) {
  const router = useRouter();
  const [items, setItems] = useState(() => [...activeCards].reverse());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCardWithStats | null>(null);

  const [prevActiveCards, setPrevActiveCards] = useState(activeCards);
  if (activeCards !== prevActiveCards) {
    setPrevActiveCards(activeCards);
    setItems([...activeCards].reverse());
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((c) => c.id === active.id);
      const newIndex = items.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);

      const updates = reordered.map((card, idx) => ({
        id: card.id,
        display_order: idx + 1,
      }));
      await onReorder(updates);
    },
    [items, onReorder],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, onDelete]);

  const handleTap = useCallback(
    (id: string) => {
      router.push(`/cards/${id}`);
    },
    [router],
  );

  const draggedCard = activeId ? items.find((c) => c.id === activeId) : null;
  const hasActive = items.length > 0;
  const hasCompleted = completedCards.length > 0;
  const isEmpty = !hasActive && !hasCompleted;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p className="text-sm text-gray-400 mb-1">관리할 카드가 없어요</p>
        <p className="text-xs text-gray-300">홈에서 새 카드를 추가해 보세요</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* 활성 카드 */}
        {hasActive && (
          <section>
            <SectionTitle>활성 카드</SectionTitle>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((card) => (
                    <SortableCardItem
                      key={card.id}
                      card={card}
                      onDelete={setDeleteTarget}
                      onTap={handleTap}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {draggedCard ? <DragOverlayItem card={draggedCard} /> : null}
              </DragOverlay>
            </DndContext>
          </section>
        )}

        {/* 달성한 목표 */}
        {hasCompleted && (
          <section>
            <SectionTitle>달성한 목표</SectionTitle>
            <div className="space-y-2">
              {completedCards.map((card) => (
                <CompletedCardItem
                  key={card.id}
                  card={card}
                  onDelete={setDeleteTarget}
                  onTap={handleTap}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="카드 삭제"
        description={`"${deleteTarget?.title ?? ""}" 카드를 삭제하시겠습니까?\n휴지통에서 복원할 수 있어요.`}
        confirmLabel="삭제"
        confirmColor="red"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
