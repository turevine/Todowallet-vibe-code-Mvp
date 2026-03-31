// DB 테이블 Row 타입
export interface ProjectCard {
  id: string;
  user_id: string;
  title: string;
  deadline: string | null;       // ISO date string
  design_preset: string;
  display_order: number;
  is_completed: boolean;
  completed_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// 파생값 포함 (클라이언트 계산용)
export interface ProjectCardWithStats extends ProjectCard {
  total_seconds: number;         // SUM(time_logs.duration_seconds)
  d_day: number | null;          // deadline - today (null이면 마감일 없음)
  elapsed_days: number;          // today - created_at
  total_hours_display: string;   // "347:00:05" 형태
  is_live_running?: boolean;     // 체크인 진행 중 표시용
  live_elapsed_seconds?: number; // 상세를 벗어나도 누적되는 실시간 초
}

export interface TimeLog {
  id: string;
  card_id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  logged_date: string;           // YYYY-MM-DD
  created_at: string;
}

export interface PageView {
  id: string;
  user_id: string;
  visited_at: string;
  visited_date: string;
}

// 히트맵 데이터
export interface HeatmapDay {
  date: string;                  // YYYY-MM-DD
  totalSeconds: number;
}

export interface CardHeatmapSummary {
  cardId: string;
  title: string;
  designPreset: string;
  totalSeconds: number;
  days: HeatmapDay[];
}

// 타이머 상태
export type TimerState = 'idle' | 'running' | 'paused';

export interface TimerSession {
  cardId: string;
  startedAt: string;             // ISO string (최초 체크인 시각)
  elapsedBeforePause: number;    // 초 (일시정지 전 누적)
  lastResumedAt?: string;        // ISO string (마지막 재개 시각, running 시 실시간 계산용)
  lastSyncedAt?: string;         // ISO string (elapsedBeforePause가 계산된 시각)
  state: TimerState;
}

// 체크인 컨텍스트
export interface CheckInState {
  timerState: TimerState;
  elapsedSeconds: number;
  startedAt: string | null;
}
