/** 초 → "347:00:05" 형태 (시:분:초) */
export function formatTotalTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 초 → "00:12:34" 형태 (시:분:초, 타이머용) */
export function formatTimerTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/** 초 → "2시간 30분" 형태 (히트맵 상세용) */
export function formatDurationKorean(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0 && m === 0) return "0분";
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/**
 * 목표 시간 대비 10단계 opacity 반환 (히트맵용)
 * level 0 = 0초, level 1~10 = 목표시간의 10%씩
 */
export function getHeatmapOpacity(seconds: number, targetSeconds: number): number {
  if (seconds === 0) return 0;
  const ratio = seconds / targetSeconds;
  // 1~10 단계, 각 10%씩. 최소 1단계, 최대 10단계
  const level = Math.min(10, Math.max(1, Math.ceil(ratio * 10)));
  return level * 0.1;
}

/** 초 → "2:30" 형태 (최근 기록용, 시:분) */
export function formatShortTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}
