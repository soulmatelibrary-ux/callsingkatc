-- Migration: callsigns 테이블에 status 컬럼 추가
-- 관리자 입력 시 즉시 'in_progress' 상태로 설정

-- 1. callsigns 테이블에 status 컬럼 추가
ALTER TABLE callsigns
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
CHECK (status IN ('in_progress', 'completed'));

-- 2. 기존 모든 callsigns 행의 상태를 'in_progress'로 설정 (혹시 있을 경우)
UPDATE callsigns
SET status = 'in_progress'
WHERE status IS NULL;

-- 3. 인덱스 추가 (상태 필터링 성능)
CREATE INDEX IF NOT EXISTS idx_callsigns_status ON callsigns(status);

-- 4. callsigns과 actions의 상태 동기화 로직
-- actions 테이블에서 completed 조치가 있는 callsign은 상태를 'completed'로 변경
UPDATE callsigns
SET status = 'completed'
WHERE id IN (
  SELECT DISTINCT callsign_id
  FROM actions
  WHERE status = 'completed'
);

-- 마이그레이션 완료 로그
-- 2026-02-21: callsigns.status 추가
-- - 기본값: 'in_progress'
-- - completed actions가 있는 callsign은 자동으로 'completed'로 설정
-- - 항공사가 actions를 삭제하면 callsigns.status는 다시 'in_progress'로 변경됨 (API에서 처리)
