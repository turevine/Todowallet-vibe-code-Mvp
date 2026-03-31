"use client";

import { useRef, useCallback } from "react";

export type SwipeDirection = "left" | "right" | null;

interface UseSwipeGestureOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeGesture({
  threshold = 100,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeGestureOptions = {}) {
  const directionRef = useRef<SwipeDirection>(null);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const { offset, velocity } = info;
      const swipe = Math.abs(offset.x) * velocity.x;

      if (offset.x < -threshold || swipe < -10000) {
        directionRef.current = "left";
        onSwipeLeft?.();
      } else if (offset.x > threshold || swipe > 10000) {
        directionRef.current = "right";
        onSwipeRight?.();
      } else {
        directionRef.current = null;
      }
    },
    [threshold, onSwipeLeft, onSwipeRight],
  );

  return { handleDragEnd, directionRef };
}
