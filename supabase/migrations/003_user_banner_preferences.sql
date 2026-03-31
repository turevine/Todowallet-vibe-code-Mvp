-- ============================================================
-- user_banner_preferences (홈 배너 고정 설정)
-- 어떤 브라우저/기기에서 로그인해도 동일한 배너 고정 상태 유지
-- ============================================================

CREATE TABLE user_banner_preferences (
  user_id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_locked       boolean     NOT NULL DEFAULT false,
  locked_card_id  uuid        REFERENCES project_cards(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_banner_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 배너 설정 조회"
  ON user_banner_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 배너 설정 생성"
  ON user_banner_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 배너 설정 수정"
  ON user_banner_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 배너 설정 삭제"
  ON user_banner_preferences FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_banner_preferences_updated_at
  BEFORE UPDATE ON user_banner_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
