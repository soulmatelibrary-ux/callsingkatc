-- Migration: callsigns 상태 초기화
-- 설명: 모든 callsigns의 status를 'in_progress'로 초기화
-- 이유: 기존 데이터가 'completed'로 되어있어 발생현황에 표시되지 않음

UPDATE callsigns SET status = 'in_progress' WHERE status IS NULL OR status != 'in_progress';

-- 검증
SELECT COUNT(*) as total, status FROM callsigns GROUP BY status;
