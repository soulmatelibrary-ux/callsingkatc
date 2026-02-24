-- Migration: 002_add_callsign_fields
-- 엑셀 파일 기반으로 callsigns 테이블에 새 컬럼 추가

-- 관할 섹터 및 공항 정보
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS sector VARCHAR(20);
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS departure_airport1 VARCHAR(10);
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS arrival_airport1 VARCHAR(10);
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS departure_airport2 VARCHAR(10);
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS arrival_airport2 VARCHAR(10);

-- 유사도 분석 정보
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS same_airline_code VARCHAR(10);
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS same_callsign_length VARCHAR(10);
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS same_number_position VARCHAR(20);
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS same_number_count INT;
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS same_number_ratio DECIMAL(5,2);

-- 관제 정보
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS max_concurrent_traffic INT;
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS coexistence_minutes INT;
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS error_probability INT;
ALTER TABLE callsigns ADD COLUMN IF NOT EXISTS atc_recommendation VARCHAR(50);

-- 추가 인덱스 (선택사항)
CREATE INDEX IF NOT EXISTS idx_callsigns_sector ON callsigns(sector);
CREATE INDEX IF NOT EXISTS idx_callsigns_error_probability ON callsigns(error_probability);
CREATE INDEX IF NOT EXISTS idx_callsigns_atc_recommendation ON callsigns(atc_recommendation);
