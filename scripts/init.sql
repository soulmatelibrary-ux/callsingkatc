-- KATC1 인증 시스템 데이터베이스 초기화
-- 이 스크립트는 Docker 컨테이너 시작 시 자동 실행됨

-- 항공사 테이블 생성
CREATE TABLE IF NOT EXISTS airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name_ko VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 사용자 테이블 생성 (수정됨: airline_id 및 비밀번호 추적 필드 추가)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  airline_id UUID NOT NULL REFERENCES airlines(id),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),

  -- 비밀번호 정책 추적
  is_default_password BOOLEAN DEFAULT true,
  password_change_required BOOLEAN DEFAULT true,
  last_password_changed_at TIMESTAMP,

  -- 기타 필드
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 비밀번호 이력 테이블 생성 (NEW)
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  password_hash VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by VARCHAR(50)
);

-- 자주 조회하는 항목의 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_airline_id ON users(airline_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_airlines_code ON airlines(code);
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 국내 항공사 9개 데이터 삽입 (display_order 포함)
INSERT INTO airlines (code, name_ko, name_en, display_order) VALUES
('KAL', '대한항공', 'Korean Air', 1),
('AAR', '아시아나항공', 'Asiana Airlines', 2),
('JJA', '제주항공', 'Jeju Air', 3),
('JNA', '진에어', 'Jin Air', 4),
('TWB', '티웨이항공', 'T''way Air', 5),
('ABL', '에어부산', 'Air Busan', 6),
('ASV', '에어서울', 'Air Seoul', 7),
('EOK', '이스타항공', 'Eastar Jet', 8),
('FGW', '플라이강원', 'Fly Gangwon', 9)
ON CONFLICT (code) DO NOTHING;

-- 기본 관리자 사용자 삽입 (비밀번호: Admin1234 - bcrypt hash)
-- 프로덕션 환경에서는 이 관리자 계정을 제거하거나 비밀번호를 변경해야 함
INSERT INTO users (email, password_hash, airline_id, status, role, is_default_password, password_change_required)
SELECT
  'admin@katc.com',
  '$2b$10$8NB3YMh5Q6Kx.V.LLKmFGe.c9e5rRhk9Lxy.xfV8m6YjC9YjzLPKm',
  airlines.id,
  'active',
  'admin',
  false,
  false
FROM airlines
WHERE airlines.code = 'KAL'
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- Phase 4: 항공사 데이터 및 조치 관리 시스템
-- ================================================================

-- 1. file_uploads 테이블 (엑셀 업로드 이력)
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_size INT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 처리 결과
  total_rows INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  error_message TEXT,

  -- 상태
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_at ON file_uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);

-- 2. callsigns 테이블 (유사호출부호 마스터 데이터)
CREATE TABLE IF NOT EXISTS callsigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id UUID NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
  airline_code VARCHAR(10) NOT NULL,

  -- 호출부호 쌍 정보
  callsign_pair VARCHAR(50) NOT NULL,        -- "KAL852 | KAL851"
  my_callsign VARCHAR(20) NOT NULL,          -- "KAL852"
  other_callsign VARCHAR(20) NOT NULL,       -- "KAL851"
  other_airline_code VARCHAR(10),            -- "AAR", "JJA" 등

  -- 위험도 정보
  error_type VARCHAR(30),                    -- "관제사 오류", "조종사 오류", "오류 미발생"
  sub_error VARCHAR(30),                     -- "복창오류", "무응답/재호출" 등
  risk_level VARCHAR(20),                    -- "매우높음", "높음", "낮음"
  similarity VARCHAR(20),                    -- "매우높음", "높음", "낮음"

  -- 발생 통계
  occurrence_count INT DEFAULT 0,            -- 발생 건수
  last_occurred_at TIMESTAMP,                -- 최근 발생 시간

  -- 업로드 정보
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 제약조건
  UNIQUE(airline_id, callsign_pair),
  UNIQUE(airline_code, callsign_pair)
);

CREATE INDEX IF NOT EXISTS idx_callsigns_airline_id ON callsigns(airline_id);
CREATE INDEX IF NOT EXISTS idx_callsigns_airline_code ON callsigns(airline_code);
CREATE INDEX IF NOT EXISTS idx_callsigns_pair ON callsigns(callsign_pair);
CREATE INDEX IF NOT EXISTS idx_callsigns_risk_level ON callsigns(risk_level);
CREATE INDEX IF NOT EXISTS idx_callsigns_created_at ON callsigns(created_at DESC);

-- 3. actions 테이블 (조치 이력 관리)
CREATE TABLE IF NOT EXISTS actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_id UUID NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
  callsign_id UUID NOT NULL REFERENCES callsigns(id) ON DELETE CASCADE,

  -- 조치 정보
  action_type VARCHAR(100) NOT NULL,         -- "편명 변경", "브리핑 시행", "모니터링 강화" 등
  description TEXT,                          -- 조치 상세 설명
  manager_name VARCHAR(100),                 -- 담당자명
  manager_email VARCHAR(255),                -- 담당자 이메일
  planned_due_date DATE,                     -- 조치 예정일

  -- 상태 추적
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  result_detail TEXT,                        -- 조치 결과 상세
  completed_at TIMESTAMP,                    -- 완료 날짜시간

  -- 등록자/수정자
  registered_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 관리자 검토 (선택사항)
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_actions_airline_id ON actions(airline_id);
CREATE INDEX IF NOT EXISTS idx_actions_callsign_id ON actions(callsign_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_registered_by ON actions(registered_by);
CREATE INDEX IF NOT EXISTS idx_actions_registered_at ON actions(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_actions_completed_at ON actions(completed_at DESC);

-- 4. action_history 테이블 (조치 수정 이력 - 감사 추적)
CREATE TABLE IF NOT EXISTS action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  field_name VARCHAR(50),                    -- 변경된 필드명
  old_value TEXT,                            -- 기존값
  new_value TEXT,                            -- 새 값

  -- 제약조건
  FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_action_history_action_id ON action_history(action_id);
CREATE INDEX IF NOT EXISTS idx_action_history_changed_at ON action_history(changed_at DESC);

-- ================================================================
-- Phase 4 샘플 데이터 (선택사항 - 개발 용도)
-- ================================================================

-- 호출부호 샘플 데이터 (대한항공 - KAL)
INSERT INTO callsigns
  (airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
   other_airline_code, error_type, sub_error, risk_level, similarity, occurrence_count)
SELECT
  airlines.id, 'KAL',
  'KAL852 | KAL851', 'KAL852', 'KAL851', 'KAL',
  '관제사 오류', '복창오류', '매우높음', '매우높음', 4
FROM airlines WHERE airlines.code = 'KAL'
ON CONFLICT (airline_code, callsign_pair) DO NOTHING;

INSERT INTO callsigns
  (airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
   other_airline_code, error_type, sub_error, risk_level, similarity, occurrence_count)
SELECT
  airlines.id, 'KAL',
  'KAL789 | AAR789', 'KAL789', 'AAR789', 'AAR',
  '관제사 오류', '무응답/재호출', '높음', '높음', 2
FROM airlines WHERE airlines.code = 'KAL'
ON CONFLICT (airline_code, callsign_pair) DO NOTHING;

INSERT INTO callsigns
  (airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
   other_airline_code, error_type, sub_error, risk_level, similarity, occurrence_count)
SELECT
  airlines.id, 'KAL',
  'KAL456 | AAR456', 'KAL456', 'AAR456', 'AAR',
  '조종사 오류', '고도이탈', '매우높음', '높음', 4
FROM airlines WHERE airlines.code = 'KAL'
ON CONFLICT (airline_code, callsign_pair) DO NOTHING;
