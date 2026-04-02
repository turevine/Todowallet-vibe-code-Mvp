-- 같은 체크인 세션(started_at)에서 중복 체크아웃 기록 방지
CREATE UNIQUE INDEX IF NOT EXISTS uq_time_logs_user_card_started_at
  ON time_logs (user_id, card_id, started_at);
