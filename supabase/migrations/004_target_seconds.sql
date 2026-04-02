-- 카드별 일일 목표 시간 (초 단위, NULL이면 기본 3600초 = 1시간)
ALTER TABLE project_cards
  ADD COLUMN target_seconds integer DEFAULT 3600;
