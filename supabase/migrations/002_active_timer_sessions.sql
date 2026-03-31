-- ============================================================
-- active_timer_sessions (실행 중 타이머 세션)
-- 다른 브라우저/기기에서도 실시간 타이머 표시를 위한 상태 저장
-- ============================================================

CREATE TABLE active_timer_sessions (
  card_id               uuid        PRIMARY KEY REFERENCES project_cards(id) ON DELETE CASCADE,
  user_id               uuid        NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at            timestamptz NOT NULL,
  elapsed_before_pause  integer     NOT NULL DEFAULT 0 CHECK (elapsed_before_pause >= 0),
  last_resumed_at       timestamptz,
  state                 text        NOT NULL CHECK (state IN ('running', 'paused')),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_active_timer_sessions_user_id ON active_timer_sessions (user_id);

ALTER TABLE active_timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 실행 타이머 조회"
  ON active_timer_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 실행 타이머 생성"
  ON active_timer_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 실행 타이머 수정"
  ON active_timer_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 실행 타이머 삭제"
  ON active_timer_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_active_timer_sessions_updated_at
  BEFORE UPDATE ON active_timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
