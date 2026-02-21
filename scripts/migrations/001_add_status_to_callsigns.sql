-- Migration: callsigns 테이블에 status 컬럼 추가
-- 설명: 조치 완료 상태를 추적하기 위한 status 컬럼 추가

-- 1. status 컬럼 추가 (없는 경우)
ALTER TABLE IF EXISTS callsigns
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed'));

-- 2. 모든 행을 'in_progress'로 초기화 (이미 존재하는 데이터)
UPDATE callsigns SET status = 'in_progress' WHERE status IS NULL;

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_callsigns_status ON callsigns(status);

-- 4. 검증
SELECT COUNT(*) as total, status FROM callsigns GROUP BY status;
