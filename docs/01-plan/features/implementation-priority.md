# KATC1 인증 시스템 - 우선순위별 구현 계획

**기본 정책 변경**:
- 회원가입 제거 → 항공사별 사전등록 (관리자가 이메일 주소 미리 등록)
- 사용자는 임의 비밀번호로 첫 로그인 후 반드시 변경
- 항공사별 데이터 격리

**작성일**: 2026-02-19

---

## 📋 우선순위 전략

### Phase 1: 핵심 변경 (1-2주) 🔴 필수
- 데이터 모델 확장 (항공사 테이블)
- 사전등록 흐름
- 비밀번호 강제 변경
- 항공사별 데이터 필터링

### Phase 2: 보안 강화 (2-3주) 🟡 중요
- 비밀번호 정책 강화 (특수문자 추가)
- 90일 비밀번호 변경 강제
- 비밀번호 변경 히스토리

### Phase 3: 운영 기능 (3-4주) 🟢 개선
- 항공사 관리 대시보드
- 사용자 일괄 등록
- 비밀번호 리셋

---

## 🏗️ Phase 1: 핵심 변경 (1-2주)

### 1-1. 데이터 모델 확장

#### 1-1-1. Airlines 테이블 (새로 추가) ⭐ PRIORITY 1
```sql
CREATE TABLE airlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,      -- 'KAL', 'AAR', 'TWB' 등
  name_ko VARCHAR(100) NOT NULL,         -- '대한항공', '아시아나항공' 등
  name_en VARCHAR(100),                  -- 'Korean Air' 등
  created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 데이터
INSERT INTO airlines (code, name_ko, name_en) VALUES
('KAL', '대한항공', 'Korean Air'),
('AAR', '아시아나항공', 'Asiana Airlines'),
('TWB', '티웨이항공', 'T'way Air'),
('IBK', '이스타항공', 'Eastarjet'),
('APJ', '에어부산', 'Air Busan'),
('ABL', '에어서울', 'Air Seoul'),
('BX', '비스타항공', 'Vista Airlines'),
('JJ', '진에어', 'Jin Air'),
('ZE', '이스타항공', 'Eastar Jet');
```

**빠진 항공사 추가 가능**: 향후 `airlines` 테이블에 INSERT

---

#### 1-1-2. Users 테이블 수정 (airline_id 추가)
```sql
ALTER TABLE users ADD COLUMN airline_id UUID REFERENCES airlines(id);
ALTER TABLE users ADD COLUMN last_password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN is_default_password BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN password_change_required BOOLEAN DEFAULT true;

-- 인덱스 추가
CREATE INDEX idx_users_airline_id ON users(airline_id);
```

**변경 사항**:
- `airline_id`: 사용자가 속한 항공사
- `is_default_password`: 초기 비밀번호인지 여부 (true = 반드시 변경)
- `password_change_required`: 비밀번호 변경 필수 여부 (90일마다 true로 설정)
- `last_password_changed_at`: 마지막 비밀번호 변경 시간

---

#### 1-1-3. 데이터 필터링을 위한 기본 테이블 구조 (KATC 데이터)
```sql
CREATE TABLE callsign_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code VARCHAR(10) NOT NULL,     -- KAL, AAR, TWB 등
  similar_callsign VARCHAR(50),
  description TEXT,
  severity VARCHAR(20),                  -- LOW, MEDIUM, HIGH
  airline_id UUID REFERENCES airlines(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스: 항공사별 데이터 빠른 검색
CREATE INDEX idx_callsign_warnings_airline_code ON callsign_warnings(airline_code);
CREATE INDEX idx_callsign_warnings_airline_id ON callsign_warnings(airline_id);
```

**중요**: 모든 데이터 테이블에 `airline_id` 또는 `airline_code` 필드 필수

---

### 1-2. 사전등록 흐름 (관리자 기능) ⭐ PRIORITY 2

#### 1-2-1. 관리자 페이지: 사용자 일괄 등록
```
/admin/users/bulk-register

기능:
1. CSV 파일 업로드 (이메일, 항공사)
   형식: email,airline_code
   example@kal.com,KAL
   test@aar.com,AAR

2. 또는 폼으로 수동 입력
   - 이메일
   - 항공사 (드롭다운: KAL, AAR, TWB, ...)
   - 임시 비밀번호 자동 생성 또는 입력

3. 등록 결과 확인
   - 성공: user 테이블에 INSERT
   - 실패: 이유 표시 (이메일 중복, 잘못된 항공사 등)

4. 이메일 발송 (선택사항)
   - 제목: [KATC] 초기 로그인 정보
   - 내용: 이메일, 임시 비밀번호, 첫 로그인 후 반드시 변경 안내
```

#### 1-2-2. 백엔드 API: 사용자 사전등록
```typescript
// POST /api/admin/users/register-bulk

Request:
{
  users: [
    { email: "user1@kal.com", airlineCode: "KAL", tempPassword: "Temp@1234" },
    { email: "user2@aar.com", airlineCode: "AAR", tempPassword: "Temp@5678" }
  ]
}

Response:
{
  success: 3,
  failed: 1,
  results: [
    { email: "user1@kal.com", status: "success", userId: "uuid-1" },
    { email: "user2@aar.com", status: "success", userId: "uuid-2" },
    { email: "user3@twb.com", status: "failed", error: "Invalid airline code" }
  ]
}

Logic:
1. 이메일 중복 확인
2. 항공사 코드 확인
3. 임시 비밀번호 bcrypt 해싱
4. users 테이블에 INSERT
   - status = 'active' (사전등록이므로 pending 불필요)
   - is_default_password = true
   - password_change_required = true
   - airline_id = (항공사 ID)
5. 결과 반환
```

---

### 1-3. 첫 로그인 시 비밀번호 강제 변경 ⭐ PRIORITY 3

#### 1-3-1. 프론트엔드: 비밀번호 변경 강제 페이지
```
로그인 성공
    ↓
is_default_password 확인
    ↓
true → /change-password (강제)
false → /dashboard (정상)

/change-password 페이지:
- 현재 비밀번호 필드 (초기 임시 비밀번호)
- 새 비밀번호 필드 (강화된 정책)
- 비밀번호 확인 필드
- '변경' 버튼
- 로그아웃 불가 (강제 변경)

Zod 검증:
- 새 비밀번호 != 현재 비밀번호
- 8자 이상
- 대문자 포함
- 소문자 포함
- 숫자 포함
- 특수문자 포함 (!@#$%^&* 등)
```

#### 1-3-2. 백엔드 API: 초기 비밀번호 변경
```typescript
// POST /api/auth/change-initial-password

Request:
{
  currentPassword: "Temp@1234",
  newPassword: "NewPass@123"
}

Response (성공):
{
  message: "비밀번호가 변경되었습니다.",
  user: { id, email, airline: { code, name_ko } }
}

Logic:
1. 현재 accessToken 검증
2. 현재 비밀번호 bcrypt 비교
3. 새 비밀번호 정책 검증 (특수문자 포함)
4. 새 비밀번호 bcrypt 해싱
5. users 테이블 UPDATE
   - password_hash = new hash
   - is_default_password = false
   - password_change_required = false
   - last_password_changed_at = NOW()
6. /dashboard로 리다이렉트
```

#### 1-3-3. 비밀번호 정책 (강화된)
```typescript
// lib/constants.ts

export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,     // A-Z
  REQUIRE_LOWERCASE: true,     // a-z
  REQUIRE_NUMBER: true,        // 0-9
  REQUIRE_SPECIAL: true,       // !@#$%^&*()_+-=[]{}|;:,.<>?
};

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]).{8,}$/;

export const PASSWORD_RULE = '8자 이상, 대문자·소문자·숫자·특수문자 모두 포함';
```

---

### 1-4. 항공사별 데이터 필터링 ⭐ PRIORITY 4

#### 1-4-1. 프론트엔드: 자동 필터링
```typescript
// hooks/useCallsignWarnings.ts

export function useCallsignWarnings() {
  const { user } = useAuthStore();  // user.airline = { id, code }

  return useQuery({
    queryKey: ['callsign-warnings', user?.airline?.id],
    queryFn: async () => {
      // 서버가 자동으로 항공사 필터링
      const response = await fetch('/api/callsign-warnings');
      return response.json();
    },
  });
}

// 사용: 자동으로 사용자의 항공사 데이터만 조회
const { data: warnings } = useCallsignWarnings();
// warnings = KAL 항공사의 데이터만 반환
```

#### 1-4-2. 백엔드: 항공사별 필터링
```typescript
// src/app/api/callsign-warnings/route.ts

export async function GET(request: Request) {
  try {
    // JWT에서 userId 추출
    const userId = verifyToken(authHeader).userId;

    // 사용자의 항공사 조회
    const user = await query(
      'SELECT airline_id FROM users WHERE id = $1',
      [userId]
    );

    if (!user || !user.airline_id) {
      return Response(403, { error: '항공사 정보가 없습니다.' });
    }

    // 해당 항공사의 데이터만 반환
    const warnings = await query(
      'SELECT * FROM callsign_warnings WHERE airline_id = $1 ORDER BY created_at DESC',
      [user.airline_id]
    );

    return Response(200, { warnings });

  } catch (error) {
    return Response(500, { error: '데이터 조회 실패' });
  }
}
```

**중요 원칙**:
- 모든 데이터 API에 항공사 필터링 추가
- JWT의 userId로 항공사 확인
- 다른 항공사 데이터 접근 시 403 Forbidden 반환

---

#### 1-4-3. 데이터 필터링 체크리스트
```
GET /api/callsign-warnings          ✅ 필터링
GET /api/user/profile               ✅ 필터링
GET /api/incidents                  ✅ 필터링
GET /api/reports                    ✅ 필터링
GET /api/statistics                 ✅ 필터링
(모든 데이터 API에 적용)
```

---

## 🔐 Phase 2: 보안 강화 (2-3주)

### 2-1. 90일 비밀번호 변경 강제 ⭐ PRIORITY 5

#### 2-1-1. 로그인 시 확인
```typescript
// POST /api/auth/login 에서

const daysSincePasswordChange = Math.floor(
  (Date.now() - user.last_password_changed_at) / (1000 * 60 * 60 * 24)
);

if (daysSincePasswordChange > 90) {
  return Response(200, {
    user,
    accessToken,
    forceChangePassword: true,  // 클라이언트에 신호
    message: '90일이 지났습니다. 비밀번호를 변경해주세요.'
  });
}
```

#### 2-1-2. 프론트엔드: 강제 변경 알림
```typescript
// src/components/forms/LoginForm.tsx

async function onSubmit(values: LoginFormValues) {
  const result = await fetch('/api/auth/login', ...);

  if (result.forceChangePassword) {
    // 30초 후 /change-password로 자동 이동
    setTimeout(() => {
      router.push('/change-password');
    }, 3000);

    // 또는 즉시 이동
    setShowForceChangePasswordModal(true);
  }
}
```

---

### 2-2. 비밀번호 변경 히스토리 ⭐ PRIORITY 6

```sql
CREATE TABLE password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  password_hash VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  changed_by VARCHAR(50)  -- 'self', 'admin', 'system'
);

-- 기능: 최근 5개 비밀번호와 같은 비밀번호 사용 방지
-- 비밀번호 변경 시 이전 5개와 비교
```

---

## 📊 Phase 3: 운영 기능 (3-4주)

### 3-1. 항공사 관리 대시보드 ⭐ PRIORITY 7
- 항공사 목록 조회/추가/수정
- 항공사별 사용자 수 통계
- 항공사별 마지막 로그인 시간

### 3-2. 사용자 일괄 등록 개선 ⭐ PRIORITY 8
- CSV 파일 업로드
- 등록 결과 다운로드
- 실패한 사용자 재시도

### 3-3. 관리 기능 ⭐ PRIORITY 9
- 사용자 비밀번호 리셋 (관리자)
- 사용자 비활성화 (퇴사 등)
- 로그인 로그 조회

---

## 📈 구현 타임라인

```
Week 1-2 (Phase 1: 핵심)
├─ 1-1. 데이터 모델 확장          (3-4시간)
├─ 1-2. 사전등록 API             (4-5시간)
├─ 1-3. 초기 비밀번호 변경        (4-5시간)
└─ 1-4. 항공사별 필터링           (3-4시간)

Week 3-4 (Phase 2: 보안)
├─ 2-1. 90일 강제 변경           (2-3시간)
└─ 2-2. 비밀번호 히스토리        (2-3시간)

Week 5-6 (Phase 3: 운영)
├─ 3-1. 항공사 관리 대시보드     (4-5시간)
├─ 3-2. 일괄 등록 개선           (3-4시간)
└─ 3-3. 관리 기능                (4-5시간)
```

---

## 🎯 API 엔드포인트 변경 사항

### 신규 API
```
POST   /api/admin/users/register-bulk        - 사용자 일괄 등록
POST   /api/auth/change-initial-password     - 초기 비밀번호 변경
GET    /api/airlines                          - 항공사 목록
GET    /api/callsign-warnings                 - 데이터 (항공사별 필터링)
GET    /api/admin/users/statistics            - 통계 (항공사별)
PATCH  /api/admin/users/{id}/reset-password  - 비밀번호 리셋
```

### 수정된 API
```
POST   /api/auth/login                 - forceChangePassword 추가
GET    /api/auth/me                    - airline 정보 추가
GET    /api/admin/users                - airline_id 필터링 추가
```

---

## 📋 데이터 모델 최종 정리

### Airlines (항공사)
```
id (UUID PK)
code (VARCHAR 10, UNIQUE) - 'KAL', 'AAR' 등
name_ko (VARCHAR 100)
name_en (VARCHAR 100)
created_at
```

### Users (사용자) - 수정됨
```
기존:
- id, email, password_hash, status, role, approved_at, approved_by
  last_login_at, created_at, updated_at

추가:
- airline_id (UUID FK)
- is_default_password (BOOLEAN)
- password_change_required (BOOLEAN)
- last_password_changed_at (TIMESTAMP)
```

### Password History (비밀번호 이력)
```
id (UUID PK)
user_id (UUID FK)
password_hash
changed_at
changed_by
```

### Callsign Warnings (유사호출부호 경고) - 필터링
```
기존 필드
+ airline_id (UUID FK)
+ airline_code (VARCHAR 10)
```

---

## ✅ 구현 체크리스트

### Phase 1 (1-2주)
- [ ] Airlines 테이블 생성 + 기본 데이터 INSERT
- [ ] Users 테이블 컬럼 추가 (airline_id, is_default_password 등)
- [ ] 사전등록 API 구현
- [ ] 초기 비밀번호 변경 페이지/API
- [ ] 항공사별 데이터 필터링 (모든 API에 적용)
- [ ] 테스트: KAL 사용자 → KAL 데이터만 조회

### Phase 2 (2-3주)
- [ ] 90일 비밀번호 변경 강제
- [ ] 비밀번호 히스토리 테이블 + 중복 검증
- [ ] 테스트: 동일 비밀번호 사용 불가

### Phase 3 (3-4주)
- [ ] 항공사 관리 대시보드
- [ ] CSV 일괄 등록
- [ ] 관리자 기능 (리셋, 비활성화 등)

---

## 🔑 핵심 변경점 요약

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| 가입 방식 | 사용자 회원가입 | 관리자 사전등록 |
| 초기 비밀번호 | 사용자가 설정 | 임의 생성, 첫 로그인 후 변경 |
| 비밀번호 정책 | 대문자+숫자 | 대문자+소문자+숫자+특수문자 |
| 비밀번호 변경 | 필요시 | 90일마다 강제 |
| 사용자 상태 | pending → active | active (사전등록) |
| 데이터 접근 | 전체 | 항공사별 필터링 |
| 항공사 | 없음 | airlines 테이블 관리 |

---

**다음**: Phase 1 구현 시작 (데이터 모델 변경 → API 구현 → 테스트)
