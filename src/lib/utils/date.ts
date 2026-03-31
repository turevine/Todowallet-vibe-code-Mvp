import { differenceInCalendarDays, format, startOfMonth, endOfMonth } from "date-fns";

/**
 * D-Day 계산: deadline이 null이면 null 반환
 * deadline > today → 음수 (D-67)
 * deadline = today → 0 (D-DAY)
 * deadline < today → 양수 (D+14)
 */
export function calculateDDay(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(today, deadlineDate);
}

/** 진행일수 계산: today - createdAt (1일째부터 시작) */
export function calculateElapsedDays(createdAt: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(today, created) + 1;
}

/**
 * D-Day 표시 문자열
 * null → ""
 * 0 → "D-DAY"
 * 음수 → "D-67" (남은 일수)
 * 양수 → "D+14" (초과)
 * isCompleted가 true면 "달성" 반환
 */
export function formatDDay(dDay: number | null, isCompleted?: boolean): string {
  if (isCompleted) return "달성";
  if (dDay === null) return "";
  if (dDay === 0) return "D-DAY";
  if (dDay < 0) return `D${dDay}`;
  return `D+${dDay}`;
}

/** 날짜를 YYYY.MM.DD 형태로 */
export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "yyyy.MM.dd");
}

/** 월의 시작일, 마지막일 (YYYY-MM-DD 형태) */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const date = new Date(year, month - 1, 1);
  return {
    start: format(startOfMonth(date), "yyyy-MM-dd"),
    end: format(endOfMonth(date), "yyyy-MM-dd"),
  };
}

/** 오늘 날짜 YYYY-MM-DD */
export function getToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}
