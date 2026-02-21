# Plan: 공지사항 관리 시스템 (Phase 5)

**Feature**: announcement-system
**Level**: Dynamic (fullstack BaaS + Next.js)
**Date**: 2026-02-21
**Status**: Planning
**Based On**: Phase 1-4 구현 완료 (인증, 항공사 관리, 조치 관리)

---

## 📋 Executive Summary

KATC1 항공사 유사호출부호 경고시스템의 Phase 5입니다.
현재 구현된 인증 시스템(Phase 1), 항공사 관리(Phase 2), 조치 관리(Phase 3-4)를 기반으로,
**공지사항 입력 및 배포** 기능을 추가합니다.

- **핵심 목표**: 관리자가 입력한 공지사항을 시간 기반으로 항공사 사용자에게 팝업으로 전달
- **주요 기능**: 공지사항 CRUD, 기간 설정(start_date ~ end_date), 팝업 표시, 이력 조회
- **예상 기간**: 1-2일

---

## 🎯 목표 (Objectives)

### Primary Objectives

1. **관리자 공지사항 관리**
   - 공지사항 생성/수정/삭제
   - 표시 기간 설정 (start_date, end_date)
   - 대상 항공사 선택 (전체 또는 특정 항공사)
   - 긴급도 레벨 설정 (warning, info, success)

2. **사용자 공지사항 표시**
   - 로그인 후 활성 공지사항 팝업으로 표시
   - 기간 내 공지사항만 표시 (현재 시간 기준)
   - 팝업 한 번 닫으면 세션 내 다시 보지 않음
   - 공지사항 상세 조회 가능

3. **공지사항 이력 조회**
   - 사용자: 자신의 항공사 공지사항 이력 조회
   - 관리자: 전체 공지사항 이력 + 읽음 상태 추적
   - 필터: 기간, 긴급도, 상태(활성/만료)

---

## 📊 범위 (Scope)

### In Scope ✅

**데이터 레벨**:
- announcements 테이블: 공지사항 마스터 데이터 (8-10 columns)
- announcement_views 테이블: 사용자별 읽음 상태 추적 (4-5 columns)

**API 레벨** (Next.js API Routes):
- `GET /api/announcements` - 활성 공지사항 조회 (권한 검증)
- `GET /api/announcements/history` - 공지사항 이력 조회
- `GET /api/announcements/{id}` - 공지사항 상세 조회
- `POST /api/announcements/{id}/view` - 읽음 상태 기록 (클라이언트)
- `POST /api/admin/announcements` - 공지사항 생성 (관리자만)
- `PATCH /api/admin/announcements/{id}` - 공지사항 수정 (관리자만)
- `DELETE /api/admin/announcements/{id}` - 공지사항 삭제 (관리자만)
- `GET /api/admin/announcements` - 전체 공지사항 목록 (관리자만)

**훅 레벨** (React Query v5):
- `useActiveAnnouncements()` - 현재 활성 공지사항 조회
- `useAnnouncementHistory()` - 공지사항 이력 조회
- `useAnnouncement(id)` - 공지사항 상세 조회
- `useViewAnnouncement()` - 읽음 상태 기록 (mutation)
- `useCreateAnnouncement()` - 공지사항 생성 (관리자)
- `useUpdateAnnouncement()` - 공지사항 수정 (관리자)
- `useDeleteAnnouncement()` - 공지사항 삭제 (관리자)
- `useAdminAnnouncements()` - 전체 공지사항 목록 (관리자)

**UI 레벨** (Next.js Pages + React Components):
- 공지사항 팝업 컴포넌트 (모든 페이지에 적용)
- 공지사항 이력 페이지 (사용자 + 관리자)
- 관리자 공지사항 관리 페이지 (/admin/announcements)
- Dashboard에 공지사항 이력 탭 (기존 개선)

**권한 설계** (Bearer Token + role 검증):
- 항공사 사용자: 자신의 항공사 공지사항만 조회/읽음
- 관리자: 전체 공지사항 CRUD + 전체 읽음 상태 조회

### Out of Scope ❌

- 공지사항 자동 발송 (이메일/SMS)
- 공지사항 읽음 확인 통계 분석
- 구독 메커니즘 (사용자 선택 구독)
- 실시간 알림 (WebSocket)
- 파일/이미지 첨부

---

## 💾 데이터 설계 (Database Schema)

### 1. announcements 테이블 (PostgreSQL)

```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  title VARCHAR(255) NOT NULL,          -- "KAL-AAL 호출부호 개선 조치"
  content TEXT NOT NULL,                -- 공지사항 본문 (마크다운 지원 선택)
  level VARCHAR(20) DEFAULT 'info',    -- 'warning', 'info', 'success'

  -- 기간 설정
  start_date TIMESTAMP NOT NULL,        -- 공지 시작 일시
  end_date TIMESTAMP NOT NULL,          -- 공지 종료 일시
  is_active BOOLEAN DEFAULT true,       -- 활성 여부

  -- 대상 설정
  target_airlines VARCHAR(255),         -- 대상 항공사 IDs (JSON 배열 또는 CSV)
  -- target_airlines = NULL이면 전체 항공사
  -- target_airlines = "uuid1,uuid2"이면 특정 항공사만

  -- 메타데이터
  created_by UUID NOT NULL REFERENCES users(id),  -- 작성자 (관리자)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_start_end (start_date, end_date),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
);
```

### 2. announcement_views 테이블 (사용자별 읽음 상태)

```sql
CREATE TABLE announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- 읽음 상태
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dismissed_at TIMESTAMP,               -- 팝업 닫은 시간 (선택사항)

  -- 복합 인덱스
  UNIQUE(announcement_id, user_id),
  INDEX idx_announcement (announcement_id),
  INDEX idx_user (user_id),
  INDEX idx_viewed_at (viewed_at)
);
```

---

## 🔌 API 설계 (Next.js API Routes)

### 사용자 API (권한: user)

#### 1. 활성 공지사항 조회
```
GET /api/announcements
Query: (없음 - 로그인한 사용자의 항공사 + 현재 시간 기준 자동 필터)
Response:
  {
    announcements: [
      {
        id, title, content, level,
        startDate, endDate,
        createdAt
      }
    ],
    total: 2
  }
Authorization: Bearer {accessToken}

로직:
- user의 airline_id 조회
- announcements 테이블에서:
  - start_date <= NOW() <= end_date (활성 기간)
  - is_active = true
  - (target_airlines IS NULL OR user.airline_id IN target_airlines)
- announcement_views에서 읽음 여부 JOIN (선택사항)
```

#### 2. 공지사항 이력 조회
```
GET /api/announcements/history
Query:
  - level=warning|info|success (선택)
  - status=active|expired|all (선택)
  - dateFrom=2026-01-01, dateTo=2026-02-28 (선택)
  - page=1, limit=20
Response:
  {
    announcements: [
      {
        id, title, level, status,
        startDate, endDate,
        isViewed (announcement_views 기준),
        createdAt
      }
    ],
    total: 50,
    page: 1
  }
Authorization: Bearer {accessToken}

로직:
- 사용자의 항공사 기준으로 필터링
- 기간, 긴급도 필터 적용
- 페이지네이션
```

#### 3. 공지사항 상세 조회
```
GET /api/announcements/{id}
Response:
  {
    id, title, content, level,
    startDate, endDate,
    createdBy, createdAt,
    updatedBy, updatedAt,
    isViewed (현재 사용자)
  }
Authorization: Bearer {accessToken}
```

#### 4. 공지사항 읽음 상태 기록
```
POST /api/announcements/{id}/view
Body: { }
Response: { status: "recorded" }
Authorization: Bearer {accessToken}

로직:
- announcement_views 테이블에 (announcement_id, user_id) 기록
- 이미 있으면 UPSERT
```

### 관리자 API (권한: admin)

#### 1. 공지사항 생성
```
POST /api/admin/announcements
Body:
  {
    title: "KAL 조치 완료 안내",
    content: "2026-02-21일 유사호출부호 조치가 완료되었습니다.",
    level: "success",
    startDate: "2026-02-21T09:00:00Z",
    endDate: "2026-02-28T18:00:00Z",
    targetAirlines: ["uuid1", "uuid2"]  // null이면 전체
  }
Response: { id, status: "created" }
Authorization: Bearer {accessToken} + role=admin
```

#### 2. 공지사항 수정
```
PATCH /api/admin/announcements/{id}
Body: { title?, content?, level?, startDate?, endDate?, targetAirlines? }
Response: { id, status: "updated" }
Authorization: Bearer {accessToken} + role=admin
```

#### 3. 공지사항 삭제
```
DELETE /api/admin/announcements/{id}
Response: { status: "deleted" }
Authorization: Bearer {accessToken} + role=admin

로직:
- ON DELETE CASCADE로 announcement_views도 함께 삭제
```

#### 4. 공지사항 목록 (관리자용)
```
GET /api/admin/announcements
Query:
  - level=warning|info|success (선택)
  - status=active|expired|all (선택)
  - dateFrom, dateTo
  - page=1, limit=20
Response:
  {
    announcements: [
      {
        id, title, level, status,
        startDate, endDate,
        targetAirlines (배열),
        viewCount (advertisement_views 집계),
        createdBy, createdAt
      }
    ],
    total: 100,
    page: 1
  }
Authorization: Bearer {accessToken} + role=admin

로직:
- 모든 공지사항 조회
- view count 집계 (항공사별)
```

---

## 🏗️ 구현 계획 (Implementation Plan)

### Phase 1: 데이터베이스 설계 및 마이그레이션 (0.5일)

1. announcements, announcement_views 테이블 생성
2. PostgreSQL 마이그레이션 스크립트 작성 (scripts/init.sql 추가)
3. 샘플 데이터 (3-5개 공지사항) 추가
4. 인덱스 최적화

### Phase 2: 백엔드 API 구현 (1일)

**API Route 구현** (src/app/api/):
1. `GET /api/announcements` - 활성 공지사항 조회 + 필터
2. `GET /api/announcements/history` - 이력 조회
3. `GET /api/announcements/{id}` - 상세 조회
4. `POST /api/announcements/{id}/view` - 읽음 기록
5. `POST /api/admin/announcements` - 생성
6. `PATCH /api/admin/announcements/{id}` - 수정
7. `DELETE /api/admin/announcements/{id}` - 삭제
8. `GET /api/admin/announcements` - 관리자용 목록

**기술 스택**:
- pg-promise / PostgreSQL
- 권한 검증: Bearer Token + role=admin
- 시간 기반 필터: start_date <= NOW() <= end_date

### Phase 3: 프론트엔드 구현 (0.5-1일)

**훅 구현** (src/hooks/):
- `useActiveAnnouncements()` - 활성 공지사항 조회
- `useAnnouncementHistory()` - 이력 조회
- `useAnnouncement(id)` - 상세 조회
- `useViewAnnouncement()` - 읽음 기록 (mutation)
- `useAdminAnnouncements()` - 관리자용 목록
- `useCreateAnnouncement()` - 생성 (mutation)
- `useUpdateAnnouncement()` - 수정 (mutation)
- `useDeleteAnnouncement()` - 삭제 (mutation)

**컴포넌트 구현** (src/components/):
- `AnnouncementModal` - 팝업 컴포넌트 (모든 페이지에 적용)
- `AnnouncementTable` - 이력 테이블
- `AnnouncementForm` - 생성/수정 폼 (관리자용)

**페이지 구현** (src/app/):
- `/announcements` 페이지 (사용자 - 이력 조회)
- `/admin/announcements` 페이지 (관리자 - CRUD)
- Layout에 `AnnouncementModal` 통합 (모든 페이지에서 표시)

**UI 패턴**:
- 팝업: 중앙 모달, 긴급도별 색상 (warning: 빨강, info: 파랑, success: 초록)
- 닫기 버튼: 한 번 닫으면 세션 내 다시 표시 안 함
- 이력 테이블: 읽음 여부 아이콘, 기간 표시

### Phase 4: 테스트 및 검증 (0.5일)

1. API 테스트 (Zero Script QA)
2. 권한 검증 테스트 (admin only)
3. 기간 필터 테스트 (start_date <= NOW() <= end_date)
4. 항공사 필터 테스트 (target_airlines)

---

## ⚙️ 기술 스택

| 계층 | 기술 | 용도 |
|------|------|------|
| DB | PostgreSQL | 공지사항, 읽음 상태 저장 |
| Backend | Next.js 14 API Routes | REST API (Node.js 런타임) |
| Frontend | React 18 + TypeScript | 사용자 인터페이스 |
| State | Zustand + TanStack Query v5 | 인증 + API 캐싱 |
| Auth | JWT (Bearer Token) | Bearer {accessToken} 패턴 |
| 스타일 | Tailwind CSS | airline.html 색상 적용 |

---

## 🔐 권한 설계 (RBAC)

| 기능 | 항공사 사용자 | 관리자 |
|------|:---:|:---:|
| 활성 공지사항 조회 (팝업) | ✅ | ✅ |
| 공지사항 이력 조회 | ✅ | ✅ |
| 공지사항 생성 | ❌ | ✅ |
| 공지사항 수정 | ❌ | ✅ |
| 공지사항 삭제 | ❌ | ✅ |
| 전체 공지사항 조회 | ❌ | ✅ |
| 읽음 상태 조회 | 자신만 | 전체 |

---

## 📈 성공 기준 (Acceptance Criteria)

### 기능 요구사항

**공지사항 작성**:
- [ ] 관리자가 공지사항 생성 가능 (제목, 내용, 긴급도, 기간, 대상 항공사)
- [ ] 기간은 start_date ~ end_date로 설정
- [ ] 대상 항공사는 전체 또는 특정 항공사 선택 가능

**공지사항 표시**:
- [ ] 로그인 후 활성 공지사항 팝업으로 표시
- [ ] 기간 내 공지사항만 표시 (NOW() >= start_date AND NOW() <= end_date)
- [ ] 팝업 닫으면 세션 내 다시 보지 않음
- [ ] 긴급도별 색상 구분 표시

**공지사항 이력**:
- [ ] 사용자가 자신의 항공사 공지사항 이력 조회 가능
- [ ] 관리자가 전체 공지사항 이력 조회 가능
- [ ] 읽음 여부 표시
- [ ] 기간, 긴급도, 상태(활성/만료) 필터 가능

**관리자 관리 페이지**:
- [ ] 공지사항 목록 테이블 (CRUD 가능)
- [ ] 읽음 상태 통계 표시
- [ ] 기간 내 공지사항 관리

### 비기능 요구사항

- [ ] API 응답 시간 < 300ms
- [ ] TanStack Query 캐싱 (30초 staleTime)
- [ ] 권한 검증으로 데이터 보안 확보
- [ ] 모바일 반응형 UI

---

## 🚨 위험성 및 완화책 (Risks & Mitigation)

| 위험 | 확률 | 영향 | 완화책 |
|------|------|------|--------|
| 기간 필터링 오류 (시간대) | 중 | 중 | UTC 기준 명시, 테스트 케이스 추가 |
| 팝업 중복 표시 | 낮음 | 낮음 | 세션 스토리지로 관리 |
| 대량 읽음 상태 기록 | 낮음 | 낮음 | 배치 처리 고려 |
| 권한 검증 누락 | 낮음 | 높음 | 모든 관리자 API에 role 검증 |

---

## 📝 관련 문서

- **Design**: announcement-system.design.md (다음 단계)
- **기존 인증**: katc1-auth-v1.md
- **항공사 관리**: airline-management.md (Phase 2)
- **조치 관리**: airline-data-action-management.md (Phase 3-4)

---

## ✅ Plan 체크리스트

- [x] 목표 정의 (3개: 관리자 관리, 사용자 표시, 이력 조회)
- [x] 데이터 설계 (2 테이블)
- [x] API 설계 (8 endpoints)
- [x] 구현 순서 명시 (4 phases)
- [x] 성공 기준 정의 (기능 + 비기능)
- [x] 위험 분석
- [x] 현재 구현 패턴 반영 (JWT, React Query, Next.js)

**다음 단계**: Design 문서 작성 → `/pdca design announcement-system`
