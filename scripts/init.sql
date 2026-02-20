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
