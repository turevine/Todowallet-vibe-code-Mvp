"use client";

import { type ReactNode, useCallback, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";

const SWIPE_THRESHOLD = 140;
const FAST_SWIPE_OFFSET = 85;
const FAST_SWIPE_POWER = 14000;

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap?: () => void;
  enabled?: boolean;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  enabled = true,
}: SwipeableCardProps) {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-10, 0, 10]);
  const cardScale = useTransform(x, [-200, 0, 200], [0.98, 1, 0.98]);
  const leftScale = useTransform(x, [-SWIPE_THRESHOLD, -20, 0], [1, 0.5, 0]);
  const rightScale = useTransform(x, [0, 20, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const leftBgOpacity = useTransform(x, [-200, -40, 0], [1, 0.4, 0]);
  const rightBgOpacity = useTransform(x, [0, 40, 200], [0, 0.4, 1]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;
      const swipePower = Math.abs(offset.x) * Math.abs(velocity.x);

      if (offset.x < -SWIPE_THRESHOLD || (offset.x < -FAST_SWIPE_OFFSET && swipePower > FAST_SWIPE_POWER)) {
        draggedRef.current = true;
        onSwipeLeft();
      } else if (offset.x > SWIPE_THRESHOLD || (offset.x > FAST_SWIPE_OFFSET && swipePower > FAST_SWIPE_POWER)) {
        draggedRef.current = true;
        onSwipeRight();
      }
    },
    [onSwipeLeft, onSwipeRight],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* 배경 인디케이터 — 삭제 (왼쪽) */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-red-500 flex items-center justify-start pl-6"
        style={{ opacity: leftBgOpacity }}
      >
        <motion.span
          className="text-white text-3xl font-bold"
          style={{ scale: leftScale }}
        >
          ✕
        </motion.span>
      </motion.div>

      {/* 배경 인디케이터 — 완료 (오른쪽) */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-emerald-500 flex items-center justify-end pr-6"
        style={{ opacity: rightBgOpacity }}
      >
        <motion.span
          className="text-white text-3xl font-bold"
          style={{ scale: rightScale }}
        >
          ✓
        </motion.span>
      </motion.div>

      {/* 드래그 가능한 카드 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onPointerDown={(e) => {
          pointerStartRef.current = { x: e.clientX, y: e.clientY };
          draggedRef.current = false;
        }}
        onPointerUp={(e) => {
          const start = pointerStartRef.current;
          if (!start) return;
          const movedX = Math.abs(e.clientX - start.x);
          const movedY = Math.abs(e.clientY - start.y);
          const movedEnough = movedX > 8 || movedY > 8;
          if (!draggedRef.current && !movedEnough) {
            onTap?.();
          }
        }}
        style={{ x, rotate, scale: cardScale }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        whileHover={{ y: -2, boxShadow: "0 10px 24px rgba(0,0,0,0.16)" }}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
