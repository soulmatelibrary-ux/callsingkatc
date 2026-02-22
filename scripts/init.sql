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
('KAL', '대한항공', 'KOREAN AIR', 1),
('AAR', '아시아나항공', 'ASIANA AIRLINES', 2),
('JJA', '제주항공', 'JEJUair', 3),
('JNA', '진에어', 'JIN AIR', 4),
('TWB', '티웨이항공', 't''way Air', 5),
('ABL', '에어부산', 'AIR BUSAN', 6),
('ASV', '에어서울', 'AIR SEOUL', 7),
('EOK', '이스타항공', 'EASTAR JET', 8),
('FGW', '플라이강원', 'Aero K', 9)
ON CONFLICT (code) DO NOTHING;

-- 기본 관리자 사용자 삽입 (비밀번호: Admin1234 - bcrypt hash)
-- 프로덕션 환경에서는 이 관리자 계정을 제거하거나 비밀번호를 변경해야 함
INSERT INTO users (email, password_hash, airline_id, status, role, is_default_password, password_change_required)
SELECT
  'admin@katc.com',
  '$2b$10$Lt/H/23KNwU4ctxRXoGr1OjUddKuCxpxVJ2M3NZrgxc37WWrGGzoa',
  airlines.id,
  'active',
  'admin',
  false,
  false
FROM airlines
WHERE airlines.code = 'KAL'
ON CONFLICT (email) DO NOTHING;

-- 샘플 항공사 사용자 삽입 (비밀번호: User1234)
-- 테스트용 사용자 계정 (프로덕션 환경에서는 제거해야 함)
INSERT INTO users (email, password_hash, airline_id, status, role, is_default_password, password_change_required)
SELECT 'kal-user@katc.com', '$2b$10$3uZyHJQMHHXF9VXCjGQ.iuQPvCJzZxBXczRY6q7p.kRBCEv1NWr7K', id, 'active', 'user', true, false
FROM airlines WHERE code = 'KAL'
UNION ALL
SELECT 'aar-user@katc.com', '$2b$10$3uZyHJQMHHXF9VXCjGQ.iuQPvCJzZxBXczRY6q7p.kRBCEv1NWr7K', id, 'active', 'user', true, false
FROM airlines WHERE code = 'AAR'
UNION ALL
SELECT 'jja-user@katc.com', '$2b$10$3uZyHJQMHHXF9VXCjGQ.iuQPvCJzZxBXczRY6q7p.kRBCEv1NWr7K', id, 'active', 'user', true, false
FROM airlines WHERE code = 'JJA'
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

  -- 상태 관리
  -- 관리자 입력 → 'in_progress' (즉시)
  -- 항공사 조치 완료 → 'completed'
  -- 항공사 완료 취소 → 'in_progress'로 복원
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed')),

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
CREATE INDEX IF NOT EXISTS idx_callsigns_status ON callsigns(status);
CREATE INDEX IF NOT EXISTS idx_callsigns_created_at ON callsigns(created_at DESC);

-- 2-1. callsign_occurrences 테이블 (호출부호 쌍의 발생 이력)
-- 같은 호출부호 쌍이 여러 날짜에 발생한 경우를 별도로 관리
CREATE TABLE IF NOT EXISTS callsign_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  callsign_id UUID NOT NULL REFERENCES callsigns(id) ON DELETE CASCADE,

  -- 발생 날짜 및 정보
  occurred_date DATE NOT NULL,                     -- 발생 날짜
  occurred_time TIMESTAMP,                         -- 발생 시간 (선택사항)

  -- 발생 상황 정보
  error_type VARCHAR(30),                         -- "관제사 오류", "조종사 오류", "오류 미발생"
  sub_error VARCHAR(30),                          -- "복창오류", "무응답/재호출" 등
  location VARCHAR(100),                          -- 발생 위치 (공역, 공항 등)
  flight_level VARCHAR(20),                       -- 비행 고도

  -- 메타정보
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 제약조건: 같은 callsign에서 같은 날짜의 중복 방지
  UNIQUE(callsign_id, occurred_date)
);

CREATE INDEX IF NOT EXISTS idx_callsign_occurrences_callsign_id ON callsign_occurrences(callsign_id);
CREATE INDEX IF NOT EXISTS idx_callsign_occurrences_occurred_date ON callsign_occurrences(occurred_date DESC);

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

-- ================================================================
-- Phase 4 샘플 조치 데이터 (actions + action_history)
-- ================================================================

-- 조치 샘플 데이터 (관리자가 등록한 조치들)
INSERT INTO actions
  (airline_id, callsign_id, action_type, description, manager_name, manager_email,
   planned_due_date, status, result_detail, completed_at, registered_by, registered_at, updated_at)
SELECT
  airlines.id,
  cs.id,
  '편명 변경',
  'KAL852 호출부호 변경을 위한 사전 협의 및 시스템 수정',
  '김항공',
  'kim@katc.com',
  CURRENT_DATE + INTERVAL '7 days',
  'in_progress',
  NULL,
  NULL,
  users.id,
  NOW(),
  NOW()
FROM airlines
JOIN callsigns cs ON airlines.id = cs.airline_id AND cs.callsign_pair = 'KAL852 | KAL851'
JOIN users ON users.email = 'admin@katc.com'
WHERE airlines.code = 'KAL'
ON CONFLICT DO NOTHING;

-- 조치 샘플 데이터 2 (완료된 조치)
INSERT INTO actions
  (airline_id, callsign_id, action_type, description, manager_name, manager_email,
   planned_due_date, status, result_detail, completed_at, registered_by, registered_at, updated_at)
SELECT
  airlines.id,
  cs.id,
  '브리핑 시행',
  'KAL789 호출부호 관련 안전 브리핑 실시 (조종사 및 관제사 대상)',
  '이안전',
  'lee@katc.com',
  CURRENT_DATE - INTERVAL '3 days',
  'completed',
  '2월 20일 서울 항공 운항팀 브리핑 완료, 2월 21일 제주 운항팀 브리핑 완료',
  NOW() - INTERVAL '1 days',
  users.id,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 days'
FROM airlines
JOIN callsigns cs ON airlines.id = cs.airline_id AND cs.callsign_pair = 'KAL789 | AAR789'
JOIN users ON users.email = 'admin@katc.com'
WHERE airlines.code = 'KAL'
ON CONFLICT DO NOTHING;

-- 조치 샘플 데이터 3 (진행중)
INSERT INTO actions
  (airline_id, callsign_id, action_type, description, manager_name, manager_email,
   planned_due_date, status, result_detail, completed_at, registered_by, registered_at, updated_at)
SELECT
  airlines.id,
  cs.id,
  '모니터링 강화',
  'KAL456 호출부호의 교신 빈도 증가에 따른 강화된 모니터링 체계 도입',
  '박운항',
  'park@katc.com',
  CURRENT_DATE + INTERVAL '5 days',
  'in_progress',
  NULL,
  NULL,
  users.id,
  NOW() - INTERVAL '2 days',
  NOW()
FROM airlines
JOIN callsigns cs ON airlines.id = cs.airline_id AND cs.callsign_pair = 'KAL456 | AAR456'
JOIN users ON users.email = 'admin@katc.com'
WHERE airlines.code = 'KAL'
ON CONFLICT DO NOTHING;

-- ================================================================
-- Phase 5: 공지사항 관리 시스템
-- ================================================================

-- 1. announcements 테이블 (공지사항 마스터 데이터)
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  title VARCHAR(255) NOT NULL,          -- "KAL-AAL 호출부호 개선 조치"
  content TEXT NOT NULL,                -- 공지사항 본문

  -- 긴급도 레벨
  level VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (level IN ('warning', 'info', 'success')),

  -- 기간 설정
  start_date TIMESTAMP NOT NULL,        -- 공지 시작 일시
  end_date TIMESTAMP NOT NULL,          -- 공지 종료 일시
  is_active BOOLEAN DEFAULT true,       -- 활성 여부

  -- 대상 설정 (NULL = 전체 항공사, 또는 쉼표로 구분된 airline_id)
  target_airlines TEXT,                 -- 대상 항공사 IDs (JSON 배열 형식 또는 CSV)

  -- 메타데이터
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT chk_announcement_date_range CHECK (start_date < end_date)
);

CREATE INDEX IF NOT EXISTS idx_announcements_start_date ON announcements(start_date);
CREATE INDEX IF NOT EXISTS idx_announcements_end_date ON announcements(end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_level ON announcements(level);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by);

-- 2. announcement_views 테이블 (사용자별 읽음 상태 추적)
CREATE TABLE IF NOT EXISTS announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 읽음 상태
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMP,               -- 팝업 닫은 시간 (선택사항)

  -- 복합 인덱스 및 제약조건
  UNIQUE(announcement_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_announcement_views_announcement_id ON announcement_views(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_user_id ON announcement_views(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_viewed_at ON announcement_views(viewed_at DESC);

-- ================================================================
-- Phase 5 샘플 데이터 (선택사항 - 개발 용도)
-- ================================================================

-- 샘플 공지사항 1: 긴급 경고 (Warning)
INSERT INTO announcements (title, content, level, start_date, end_date, is_active, target_airlines, created_by)
SELECT
  '🚨 KAL-AAL 호출부호 유사 경고',
  '대한항공(KAL852)과 아시아나항공(AAR789) 호출부호 유사도가 높습니다. 2026년 2월 21일부터 조치가 시작됩니다. 모든 조종사 및 관제사는 각별한 주의가 필요합니다.',
  'warning',
  NOW(),
  NOW() + INTERVAL '7 days',
  true,
  NULL,  -- 전체 항공사
  users.id
FROM users WHERE users.email = 'admin@katc.com'
ON CONFLICT DO NOTHING;

-- 샘플 공지사항 2: 일반 정보 (Info)
INSERT INTO announcements (title, content, level, start_date, end_date, is_active, target_airlines, created_by)
SELECT
  '📢 조치 관리 시스템 사용 방법',
  '새로운 조치 관리 시스템이 도입되었습니다. 조치 등록, 수정, 완료 기능을 사용하여 유사호출부호 문제를 신속하게 관리하세요.',
  'info',
  NOW(),
  NOW() + INTERVAL '30 days',
  true,
  NULL,  -- 전체 항공사
  users.id
FROM users WHERE users.email = 'admin@katc.com'
ON CONFLICT DO NOTHING;

-- 샘플 공지사항 3: 완료 정보 (Success)
INSERT INTO announcements (title, content, level, start_date, end_date, is_active, target_airlines, created_by)
SELECT
  '✅ KAL 조치 완료 안내',
  '대한항공의 KAL852 호출부호 조치가 완료되었습니다. 모든 조종사 대상 안전 브리핑이 실시되었습니다.',
  'success',
  NOW() - INTERVAL '1 days',
  NOW() + INTERVAL '14 days',
  true,
  NULL,  -- 전체 항공사
  users.id
FROM users WHERE users.email = 'admin@katc.com'
ON CONFLICT DO NOTHING;
