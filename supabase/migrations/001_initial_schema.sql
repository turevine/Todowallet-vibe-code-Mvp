-- ============================================================
-- TodoWallet 초기 스키마 마이그레이션
-- 실행 대상: Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. project_cards (프로젝트 카드)
-- ============================================================
CREATE TABLE project_cards (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          text        NOT NULL CHECK (char_length(title) <= 30),
  deadline       date,
  design_preset  text        NOT NULL DEFAULT 'midnight',
  display_order  integer     NOT NULL DEFAULT 0,
  is_completed   boolean     NOT NULL DEFAULT false,
  completed_at   timestamptz,
  is_deleted     boolean     NOT NULL DEFAULT false,
  deleted_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  project_cards IS '프로젝트 카드 (할 일 목표)';
COMMENT ON COLUMN project_cards.title IS '목표명 (최대 30자)';
COMMENT ON COLUMN project_cards.design_preset IS '디자인 프리셋 키';
COMMENT ON COLUMN project_cards.display_order IS '홈 화면 카드 정렬 순서';
COMMENT ON COLUMN project_cards.is_deleted IS '소프트 삭제 (휴지통)';

-- ============================================================
-- 2. time_logs (시간 기록)
-- ============================================================
CREATE TABLE time_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id          uuid        NOT NULL REFERENCES project_cards(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at       timestamptz NOT NULL,
  ended_at         timestamptz NOT NULL,
  duration_seconds integer     NOT NULL CHECK (duration_seconds >= 0),
  logged_date      date        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  time_logs IS '체크인 시간 기록';
COMMENT ON COLUMN time_logs.duration_seconds IS '기록 시간(초)';
COMMENT ON COLUMN time_logs.logged_date IS '히트맵 집계용 날짜';

-- 인덱스: 카드별 날짜 조회, 사용자별 날짜 조회 (히트맵)
CREATE INDEX idx_time_logs_card_date ON time_logs (card_id, logged_date);
CREATE INDEX idx_time_logs_user_date ON time_logs (user_id, logged_date);

-- ============================================================
-- 3. page_views (DAU 측정)
-- ============================================================
CREATE TABLE page_views (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visited_at   timestamptz NOT NULL DEFAULT now(),
  visited_date date        NOT NULL DEFAULT CURRENT_DATE
);

-- 하루에 사용자당 1행만 허용
ALTER TABLE page_views
  ADD CONSTRAINT uq_page_views_user_date UNIQUE (user_id, visited_date);

COMMENT ON TABLE page_views IS '일별 방문 기록 (DAU 측정)';

-- ============================================================
-- 4. RLS (Row Level Security) 정책
-- ============================================================

-- project_cards
ALTER TABLE project_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 카드 조회"
  ON project_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 카드 생성"
  ON project_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 카드 수정"
  ON project_cards FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 카드 삭제"
  ON project_cards FOR DELETE
  USING (auth.uid() = user_id);

-- time_logs
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 시간 기록 조회"
  ON time_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 시간 기록 생성"
  ON time_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 시간 기록 수정"
  ON time_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 시간 기록 삭제"
  ON time_logs FOR DELETE
  USING (auth.uid() = user_id);

-- page_views
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 방문 기록 조회"
  ON page_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 방문 기록 생성"
  ON page_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 방문 기록 수정"
  ON page_views FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 방문 기록 삭제"
  ON page_views FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. updated_at 자동 갱신 트리거 (project_cards)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_project_cards_updated_at
  BEFORE UPDATE ON project_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
