# KATC1 인증 시스템 - 설계 문서 인덱스

**프로젝트**: KATC1 유사호출부호 경고시스템
**주제**: 사용자 인증 및 권한 관리 모듈 설계
**버전**: 1.0.0
**마지막 업데이트**: 2026-02-19

---

## 📚 설계 문서 개요

이 디렉토리는 KATC1 인증 시스템의 완전한 설계 문서 모음입니다. 각 문서는 시스템의 특정 측면을 상세히 설명하고 있습니다.

### 문서 네비게이션 맵

```
📁 02-design/
├── 📄 ARCHITECTURE_DESIGN.md (권장: 먼저 읽기)
│   └─ 시스템 전체 구조, 3계층 아키텍처, 보안 설계
├── 📄 SCREEN_STRUCTURE_DESIGN.md (다음: UI 레이아웃 이해)
│   └─ 화면 흐름, 관리자 페이지, UI 컴포넌트
├── 📄 LOGIN_SYSTEM_DESIGN.md (상세 구현 참고)
│   └─ 로그인 프로세스, 토큰 관리, 검증 로직
├── 📄 AIRLINES_DATA.md (항공사 데이터 명세)
│   └─ 항공사 목록 (11개), 데이터 격리, 드롭다운 옵션
├── 📄 security-spec.md (보안 검토 시 참고)
│   └─ 보안 정책, 방어 메커니즘, 감사 로그
└── 📄 _INDEX.md (이 문서)
    └─ 설계 문서 인덱스 및 가이드
```

---

## 📖 각 문서 상세 설명

### 1. ARCHITECTURE_DESIGN.md

**대상 독자**: 시스템 아키텍트, 백엔드 개발자, 팀 리더

**주요 내용**:
- ✅ 3계층 아키텍처 (Frontend / Backend / Database)
- ✅ 시스템 개요 및 목표
- ✅ 기술 스택 선택 근거
- ✅ 데이터베이스 설계 (Airlines, Users, Password History, Audit Logs 테이블)
- ✅ API 엔드포인트 명세 (7개 API)
- ✅ 보안 설계 (JWT, bcrypt, httpOnly 쿠키)
- ✅ 배포 전략 (로컬 → AWS → 공공기관)

**읽는 시간**: 20-30분
**연관 문서**: 모든 다른 문서의 기반

**주요 배운 점**:
```
Frontend: React + Zustand + TanStack Query
Backend: Next.js API Routes (Express 미사용)
Database: PostgreSQL 15 (순수 SQL, ORM 미사용)
Auth: JWT (accessToken 1시간 + refreshToken 7일)
```

---

### 2. SCREEN_STRUCTURE_DESIGN.md

**대상 독자**: UI/UX 디자이너, 프론트엔드 개발자, PM

**주요 내용**:
- ✅ 화면 구조도 (Site Map)
- ✅ 사용자 화면 흐름 (User Flow)
- ✅ 메인 페이지 UI 레이아웃
- ✅ 로그인 페이지 UI 명세
- ✅ **관리자 페이지 상세 설계** (5개 페이지)
  - 관리자 대시보드
  - 사용자 관리
  - 사용자 승인
  - 접근 관리
  - 비밀번호 초기화
  - 감시 로그
  - 관리자 설정
- ✅ 유사호출부호 페이지 통합 (airline.html 모움)
- ✅ 반응형 설계 (모바일 / 태블릿 / 데스크톱)
- ✅ 접근성 (A11y) 표준
- ✅ 상태 전이 다이어그램

**읽는 시간**: 25-40분
**연관 문서**: ARCHITECTURE_DESIGN.md (기반)

**주요 배운 점**:
```
화면 흐름:
로그인 → 초기 비번 변경 → 대시보드 → 유사호출부호

관리자 기능:
- 사용자 관리 (추가, 조회, 수정, 삭제)
- 권한 관리 (역할, 상태 변경)
- 비밀번호 초기화
- 감시 로그 조회
- 시스템 설정
```

---

### 3. LOGIN_SYSTEM_DESIGN.md

**대상 독자**: 백엔드 개발자, 보안 담당자

**주요 내용**:
- ✅ 로그인 시스템 개요
- ✅ 레이어 구조 상세 설명
- ✅ 로그인 프로세스 흐름
- ✅ 세션 관리 전략
- ✅ 토큰 갱신 로직
- ✅ 에러 처리 및 보안
- ✅ 초기 비밀번호 변경 흐름

**읽는 시간**: 20-30분
**연관 문서**: ARCHITECTURE_DESIGN.md, security-spec.md

**주요 배운 점**:
```
accessToken (1시간):
- Zustand 메모리 저장
- API 요청 헤더에 포함
- 새로고침 시 자동 갱신

refreshToken (7일):
- httpOnly 쿠키 저장
- XSS 공격 방어
- 토큰 갱신 시에만 사용

로그인 검증:
1. 이메일 존재 여부
2. 비밀번호 bcrypt 검증
3. 사용자 상태 확인
4. JWT 토큰 생성
```

---

### 4. AIRLINES_DATA.md

**대상 독자**: 항공사 관리자, 데이터베이스 담당자, 테스트 담당자

**주요 내용**:
- ✅ 항공사 목록 (11개 국내 항공사)
  - 대한항공, 아시아나항공, 제주항공 등
  - ICAO 코드, IATA 코드 포함
- ✅ Airlines 테이블 스키마
- ✅ SQL INSERT 스크립트 (11개 항공사)
- ✅ UI 드롭다운 옵션 (React)
- ✅ 항공사별 데이터 격리 로직
- ✅ 테스트 시나리오
- ✅ 향후 확장 계획 (항공사 추가, 통합)

**읽는 시간**: 15-20분
**연관 문서**: ARCHITECTURE_DESIGN.md, SCREEN_STRUCTURE_DESIGN.md

**주요 배운 점**:
```
총 11개 항공사:
KAL, AAR, JJA, JNA, TWB, ABL, ASV, ESR, FGW, ARK, APZ

항공사별 데이터 격리:
- 각 사용자는 자신의 항공사 데이터만 조회
- API 레벨에서 WHERE airline_id = $1 필터링
- 크로스 항공사 접근 불가

테스트 전략:
- 각 항공사별 테스트 계정 생성
- 크로스 항공사 접근 시도 테스트
- 관리자 권한 테스트
```

---

### 5. security-spec.md

**대상 독자**: 보안 담당자, 보안 리뷰어

**주요 내용**:
- ✅ 보안 정책 전문
- ✅ 공격 방어 메커니즘
- ✅ OWASP Top 10 대응
- ✅ 감사 로그 설계
- ✅ 암호화 표준
- ✅ 컴플라이언스 체크리스트

**읽는 시간**: 15-25분
**연관 문서**: ARCHITECTURE_DESIGN.md, LOGIN_SYSTEM_DESIGN.md

**주요 배운 점**:
```
SQL Injection: 매개변수화 쿼리
XSS 공격: httpOnly 쿠키
CSRF: SameSite 쿠키 + CSRF 토큰
Enumeration: 동일 에러 메시지
Timing Attack: bcrypt 타이밍 안전
Rate Limiting: 향후 구현
```

---

## 🔄 설계 문서 읽기 순서

### 빠른 이해 (30분)
1. ARCHITECTURE_DESIGN.md (시스템 개요)
2. SCREEN_STRUCTURE_DESIGN.md (화면 구조)

### 표준 이해 (60분)
1. ARCHITECTURE_DESIGN.md (시스템 개요) - 20분
2. SCREEN_STRUCTURE_DESIGN.md (화면 구조) - 25분
3. AIRLINES_DATA.md (항공사 데이터) - 15분

### 완전 이해 (90분+)
1. ARCHITECTURE_DESIGN.md - 20분
2. SCREEN_STRUCTURE_DESIGN.md - 25분
3. LOGIN_SYSTEM_DESIGN.md (로그인 상세) - 15분
4. AIRLINES_DATA.md (항공사 데이터) - 15분
5. security-spec.md (보안) - 20분
6. 관련 코드 검토 - 10분+

---

## 📋 기능별 참고 가이드

### "로그인 기능을 구현하고 싶어요"
📖 참고: LOGIN_SYSTEM_DESIGN.md → ARCHITECTURE_DESIGN.md

**포함 내용**:
- 로그인 페이지 UI
- 백엔드 로그인 API
- 토큰 저장 전략
- 세션 관리

---

### "관리자 페이지를 만들고 싶어요"
📖 참고: SCREEN_STRUCTURE_DESIGN.md → ARCHITECTURE_DESIGN.md

**포함 내용**:
- 관리자 대시보드 레이아웃
- 사용자 관리 페이지
- 접근 관리 기능
- 감시 로그 페이지

---

### "보안을 검증하고 싶어요"
📖 참고: security-spec.md → ARCHITECTURE_DESIGN.md

**포함 내용**:
- 보안 정책 체크리스트
- 공격 방어 메커니즘
- OWASP 대응
- 감사 로그 설계

---

### "데이터베이스를 구축하고 싶어요"
📖 참고: ARCHITECTURE_DESIGN.md (섹션 4) → AIRLINES_DATA.md

**포함 내용**:
- Airlines 테이블 스키마
- Users 테이블 스키마
- Password History 테이블
- Audit Logs 테이블
- 인덱스 설계
- 항공사 데이터 초기화 SQL 스크립트 (11개)

---

### "항공사 데이터와 필터링을 설정하고 싶어요"
📖 참고: AIRLINES_DATA.md → ARCHITECTURE_DESIGN.md

**포함 내용**:
- 11개 항공사 목록
- 항공사 드롭다운 옵션
- 항공사별 데이터 격리 로직
- API 필터링 쿼리
- 테스트 시나리오
- 향후 항공사 추가 절차

---

### "API를 구현하고 싶어요"
📖 참고: ARCHITECTURE_DESIGN.md (섹션 5) → LOGIN_SYSTEM_DESIGN.md

**포함 내용**:
- 7개 API 엔드포인트 명세
- 요청/응답 포맷
- 에러 처리
- 인증 검증

---

## 🎯 주요 설계 결정사항 요약

| 항목 | 결정 | 근거 |
|------|------|------|
| 프레임워크 | Next.js 14 | 풀스택 통합, App Router |
| ORM | 미사용 (순수 SQL) | 작은 규모, 성능, 간결성 |
| 인증 | JWT | 스테이트리스, 확장성 |
| accessToken 저장 | Zustand 메모리 | 성능, 간편성 |
| refreshToken 저장 | httpOnly 쿠키 | XSS 방어 |
| 비밀번호 해싱 | bcryptjs (10 라운드) | 보안, 성능 균형 |
| 사용자 가입 | 사전등록 (Pre-registration) | 조직 통제, 보안 |
| 비밀번호 정책 | 8자 + 대소문자 + 숫자 + 특수문자 | 강화된 보안 |
| 비밀번호 주기 | 90일 강제 변경 | 컴플라이언스 |
| 데이터 격리 | 항공사별 필터링 | 다중 테넌트 지원 |

---

## 🔍 검증 체크리스트

설계 검증 시 다음을 확인하세요:

- [ ] 3계층 아키텍처 이해 (ARCHITECTURE_DESIGN.md)
- [ ] 모든 화면과 흐름 확인 (SCREEN_STRUCTURE_DESIGN.md)
- [ ] 로그인 프로세스 상세 이해 (LOGIN_SYSTEM_DESIGN.md)
- [ ] 보안 정책 검토 (security-spec.md)
- [ ] 데이터 모델 승인 (ARCHITECTURE_DESIGN.md 섹션 4)
- [ ] API 명세 검토 (ARCHITECTURE_DESIGN.md 섹션 5)
- [ ] 관리자 기능 명세 확인 (SCREEN_STRUCTURE_DESIGN.md 섹션 4)
- [ ] 배포 전략 이해 (ARCHITECTURE_DESIGN.md 섹션 9)

---

## 📞 질문 및 답변 (FAQ)

### Q1: 로그인 토큰은 어디에 저장되나요?
**A**:
- **accessToken (1시간)**: Zustand 메모리 (새로고침 시 잃음)
- **refreshToken (7일)**: httpOnly 쿠키 (XSS 방어)
- 참고: LOGIN_SYSTEM_DESIGN.md, ARCHITECTURE_DESIGN.md

### Q2: 사전등록 사용자의 초기 로그인은 어떻게 되나요?
**A**:
1. 관리자가 사용자 등록 (임시 비밀번호 자동 생성)
2. 사용자 임시 비밀번호로 로그인
3. 강제로 /change-password 리다이렉트
4. 새 비밀번호로 변경 (정책: 8자 + 특수문자 포함 등)
5. /dashboard 이동
- 참고: SCREEN_STRUCTURE_DESIGN.md 섹션 2.2

### Q3: 항공사별 데이터 필터링은 어떻게 하나요?
**A**:
- 사용자의 airline_id 확인
- API 호출 시 필터링 적용
  ```
  GET /api/callsign-warnings?airline_id={user_airline_id}
  ```
- 데이터베이스 레벨에서 WHERE airline_id = $1 필터
- 참고: ARCHITECTURE_DESIGN.md 섹션 4.5

### Q4: 관리자가 할 수 있는 기능은 무엇인가요?
**A**:
- 사용자 관리 (추가, 조회, 수정, 일괄 등록)
- 역할 관리 (admin ↔ user)
- 상태 관리 (active ↔ suspended)
- 비밀번호 초기화
- 감시 로그 조회
- 시스템 설정 변경
- 참고: SCREEN_STRUCTURE_DESIGN.md 섹션 4

### Q5: 비밀번호 정책은 무엇인가요?
**A**:
- **길이**: 최소 8자
- **문자 요구**: 대문자, 소문자, 숫자, 특수문자 모두 포함
- **변경 주기**: 90일마다 강제 변경
- **이력 관리**: 최근 5개 비밀번호 재사용 불가
- **초기 변경**: 첫 로그인 시 임시 비밀번호 반드시 변경
- 참고: ARCHITECTURE_DESIGN.md 섹션 1.4

---

## 📈 문서 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| 1.0.0 | 2026-02-19 | 초기 설계 문서 작성 |
| | | - ARCHITECTURE_DESIGN.md |
| | | - LOGIN_SYSTEM_DESIGN.md |
| | | - SCREEN_STRUCTURE_DESIGN.md (NEW) |
| | | - security-spec.md |
| | | - _INDEX.md (이 문서) |

---

## 🚀 다음 단계

**다음 페이즈**: 구현 (Do Phase)

### 구현 순서
1. **데이터베이스 설정** (PostgreSQL + 테이블 생성)
2. **백엔드 API 구현** (7개 엔드포인트)
3. **프론트엔드 컴포넌트 구현** (폼, 페이지, 헤더 등)
4. **상태 관리 설정** (Zustand 스토어)
5. **통합 테스트** (회원가입-로그인-대시보드 흐름)
6. **배포 검증** (로컬 Docker → AWS)

**예상 기간**: 1-2주

---

**작성자**: AI Assistant
**마지막 수정**: 2026-02-19
**상태**: ✅ 설계 완료 (구현 단계 진행 중)

