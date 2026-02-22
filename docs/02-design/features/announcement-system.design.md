# 설계 문서: 공지사항 시스템 (Announcement System)

**Project**: KATC1 항공사 유사호출부호 경고시스템
**Feature**: 공지사항 관리 및 배포 시스템
**Date**: 2026-02-22
**Status**: Design Phase
**Level**: Dynamic (Fullstack)

---

## 1. 기능 개요

### 목표
항공교통본부(관리자)에서 항공사별 공지사항을 생성·배포하고, 항공사 사용자들이 공지사항을 조회·확인하는 통합 시스템 구축

### 주요 기능

#### 1.1 사용자 기능 (일반 사용자)
- **공지사항 목록 조회**: 자신의 항공사 대상 공지사항 조회
- **공지사항 상세 보기**: 공지사항 전문 및 상태 조회
- **읽음 상태 기록**: 공지사항 읽음/미읽 추적
- **필터링**: 긴급도(level), 상태, 기간별 필터

#### 1.2 관리자 기능
- **공지사항 생성**: 항공사별 대상 설정으로 공지사항 작성
- **공지사항 수정**: 활성화 전 기본 정보 수정
- **공지사항 삭제**: 불필요한 공지사항 삭제
- **배포 관리**: 시작일/종료일 설정으로 배포 시간 관리
- **대시보드**: 전체 공지사항 현황, 읽음률 통계

---

## 2. 데이터 모델

### 2.1 Database Schema

#### 테이블: announcements
공지사항 마스터 데이터

```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  level VARCHAR(20) NOT NULL DEFAULT 'normal',  -- critical | urgent | normal | info
  target_airlines VARCHAR(500),                  -- 쉼표 분리 항공사 코드 (NULL=전체)
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255),
  updated_at TIMESTAMP,

  -- Constraints
  CHECK (end_date > start_date),
  CHECK (level IN ('critical', 'urgent', 'normal', 'info'))
);

-- Indexes
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_dates ON announcements(start_date, end_date);
CREATE INDEX idx_announcements_level ON announcements(level);
```

#### 테이블: announcement_views
사용자의 공지사항 읽음 이력

```sql
CREATE TABLE announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Unique constraint: 사용자당 공지사항별 한 번만 기록
  UNIQUE (announcement_id, user_id)
);

-- Indexes
CREATE INDEX idx_announcement_views_user ON announcement_views(user_id);
CREATE INDEX idx_announcement_views_announcement ON announcement_views(announcement_id);
```

### 2.2 Type Definitions

```typescript
// src/types/announcement.ts

export interface Announcement {
  id: string;
  title: string;
  content: string;
  level: 'critical' | 'urgent' | 'normal' | 'info';
  targetAirlines: string[] | null;  // null=전체 항공사
  startDate: string;                 // ISO 8601
  endDate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AnnouncementView {
  announcementId: string;
  userId: string;
  viewedAt: string;
}

export interface AnnouncementWithStatus extends Announcement {
  status: 'active' | 'upcoming' | 'expired';
  isViewed: boolean;
  viewedAt?: string;
  viewCount?: number;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  level: 'critical' | 'urgent' | 'normal' | 'info';
  targetAirlines?: string[];  // 비어있으면 전체 항공사
  startDate: string;
  endDate: string;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  level?: string;
  targetAirlines?: string[];
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface AnnouncementListResponse {
  announcements: AnnouncementWithStatus[];
  total: number;
  unreadCount: number;
}

export interface AnnouncementDetailResponse extends AnnouncementWithStatus {
  viewCount: number;
}

export interface AnnouncementStatsResponse {
  total: number;
  active: number;
  upcoming: number;
  expired: number;
  byLevel: {
    critical: number;
    urgent: number;
    normal: number;
    info: number;
  };
}
```

---

## 3. API 설계

### 3.1 사용자 API (인증 필수, Bearer Token)

#### GET /api/announcements
사용자 항공사 대상 활성 공지사항 조회

**요청**:
```
GET /api/announcements?page=1&limit=20&level=critical
Authorization: Bearer {accessToken}
```

**응답** (200):
```json
{
  "announcements": [
    {
      "id": "uuid",
      "title": "긴급 공지사항",
      "level": "critical",
      "startDate": "2026-02-22T00:00:00Z",
      "endDate": "2026-03-01T23:59:59Z",
      "status": "active",
      "isViewed": false,
      "createdAt": "2026-02-22T10:00:00Z"
    }
  ],
  "total": 5,
  "unreadCount": 2
}
```

#### GET /api/announcements/{id}
공지사항 상세 조회

**요청**:
```
GET /api/announcements/{id}
Authorization: Bearer {accessToken}
```

**응답** (200):
```json
{
  "id": "uuid",
  "title": "긴급 공지사항",
  "content": "내용...",
  "level": "critical",
  "startDate": "2026-02-22T00:00:00Z",
  "endDate": "2026-03-01T23:59:59Z",
  "status": "active",
  "isViewed": false,
  "viewedAt": null,
  "viewCount": 150,
  "createdBy": "admin@katc.com",
  "createdAt": "2026-02-22T10:00:00Z"
}
```

#### POST /api/announcements/{id}/view
공지사항 읽음 상태 기록

**요청**:
```
POST /api/announcements/{id}/view
Authorization: Bearer {accessToken}
```

**응답** (200):
```json
{
  "status": "recorded",
  "viewedAt": "2026-02-22T10:15:00Z"
}
```

#### GET /api/announcements/history
공지사항 조회 이력 조회

**요청**:
```
GET /api/announcements/history?limit=50
Authorization: Bearer {accessToken}
```

**응답** (200):
```json
{
  "history": [
    {
      "id": "uuid",
      "announcementId": "uuid",
      "title": "공지사항 제목",
      "viewedAt": "2026-02-22T10:15:00Z"
    }
  ],
  "total": 12
}
```

### 3.2 관리자 API (인증 필수, Admin Role)

#### POST /api/admin/announcements
공지사항 생성

**요청**:
```
POST /api/admin/announcements
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "긴급 공지사항",
  "content": "내용...",
  "level": "critical",
  "targetAirlines": ["KAL", "AAR"],  // null=전체
  "startDate": "2026-02-22T00:00:00Z",
  "endDate": "2026-03-01T23:59:59Z"
}
```

**응답** (201):
```json
{
  "id": "uuid",
  "title": "긴급 공지사항",
  "level": "critical",
  "startDate": "2026-02-22T00:00:00Z",
  "endDate": "2026-03-01T23:59:59Z",
  "createdAt": "2026-02-22T10:00:00Z"
}
```

#### GET /api/admin/announcements
관리자용 공지사항 목록 조회 (모든 공지사항)

**요청**:
```
GET /api/admin/announcements?page=1&limit=20&status=active&level=critical
Authorization: Bearer {accessToken}
```

**응답** (200):
```json
{
  "announcements": [
    {
      "id": "uuid",
      "title": "공지사항",
      "level": "critical",
      "targetAirlines": ["KAL", "AAR"],
      "status": "active",
      "viewCount": 150,
      "totalTargetUsers": 45,
      "viewRate": 75.5,
      "createdBy": "admin@katc.com",
      "createdAt": "2026-02-22T10:00:00Z"
    }
  ],
  "total": 10
}
```

#### PATCH /api/admin/announcements/{id}
공지사항 수정

**요청**:
```
PATCH /api/admin/announcements/{id}
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "수정된 제목",
  "level": "urgent",
  "isActive": false
}
```

**응답** (200):
```json
{
  "id": "uuid",
  "title": "수정된 제목",
  "level": "urgent",
  "isActive": false,
  "updatedAt": "2026-02-22T10:30:00Z"
}
```

#### DELETE /api/admin/announcements/{id}
공지사항 삭제

**요청**:
```
DELETE /api/admin/announcements/{id}
Authorization: Bearer {accessToken}
```

**응답** (204): No Content

#### GET /api/admin/announcements/{id}/stats
공지사항 통계 조회

**요청**:
```
GET /api/admin/announcements/{id}/stats
Authorization: Bearer {accessToken}
```

**응답** (200):
```json
{
  "announcementId": "uuid",
  "title": "공지사항",
  "totalViews": 150,
  "uniqueViewers": 120,
  "targetAirlines": ["KAL", "AAR"],
  "targetUserCount": 45,
  "viewRate": 75.5,
  "viewsByAirline": {
    "KAL": { "count": 90, "rate": 80 },
    "AAR": { "count": 60, "rate": 70 }
  },
  "createdAt": "2026-02-22T10:00:00Z",
  "startDate": "2026-02-22T00:00:00Z",
  "endDate": "2026-03-01T23:59:59Z"
}
```

---

## 4. 화면 설계

### 4.1 사용자 화면

#### /announcements - 공지사항 목록
```
┌─────────────────────────────────────────────┐
│ [Header]                                    │
├─────────────────────────────────────────────┤
│ 공지사항                                     │
│ 모든 공지사항을 확인하세요                    │
├─────────────────────────────────────────────┤
│ [필터]                                      │
│ 긴급도: [전체] [긴급] [중요] [일반] [정보] │
│ 상태:   [전체] [진행중] [종료됨]            │
├─────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ [⚠️] 긴급 공지사항        [읽음] 2026-02│ │
│ │ 항공교통 시스템 점검 안내                 │ │
│ ├────────────────────────────────────────┤ │
│ │ [📢] 중요 공지사항        [미읽] 2026-02│ │
│ │ 비상절차 교육 시행                      │ │
│ ├────────────────────────────────────────┤ │
│ │ [ℹ️] 일반 공지사항        [읽음] 2026-02│ │
│ │ 시스템 점검 예정                        │ │
│ └────────────────────────────────────────┘ │
│ [이전] 1 2 3 [다음]                        │
└─────────────────────────────────────────────┘
```

#### /announcements/{id} - 공지사항 상세
```
┌─────────────────────────────────────────────┐
│ [Header]                                    │
├─────────────────────────────────────────────┤
│ [← 목록으로]                                │
│ ┌────────────────────────────────────────┐ │
│ │ [⚠️ 긴급]                               │ │
│ │ 항공교통 시스템 점검 안내                 │ │
│ │ 작성: admin@katc.com | 2026-02-22      │ │
│ │ 유효기간: 2026-02-22 ~ 2026-03-01      │ │
│ │ [읽음 상태: 2026-02-22 10:15:00]        │ │
│ ├────────────────────────────────────────┤ │
│ │                                        │ │
│ │ 공지사항 본문 내용...                    │ │
│ │                                        │ │
│ │ 조회수: 150명이 읽었습니다              │ │
│ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 4.2 관리자 화면

#### /admin/announcements - 관리자 대시보드
```
┌─────────────────────────────────────────────┐
│ [Header]                                    │
├─────────────────────────────────────────────┤
│ [← 관리자 페이지]                           │
│ 공지사항 관리                                │
│ 항공교통본부에서 배포하는 공지사항 관리       │
│                                            │
│ [+ 새 공지사항] [통계] [내보내기]            │
│                                            │
│ [필터]                                      │
│ 상태: [전체] [진행중] [예정] [종료]         │
│ 긴급도: [전체] [긴급] [중요] [일반] [정보] │
├─────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐ │
│ │ [활성화] 공지사항 제목                   │ │
│ │ KAL, AAR | 긴급 | 조회율: 85%           │ │
│ │ 유효기간: 2026-02-22 ~ 2026-03-01      │ │
│ │ [상세] [수정] [삭제]                    │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ [활성화] 공지사항 제목                   │ │
│ └────────────────────────────────────────┘ │
│ [이전] 1 2 3 [다음]                        │
└─────────────────────────────────────────────┘
```

#### /admin/announcements/create - 공지사항 작성
```
┌─────────────────────────────────────────────┐
│ [Header]                                    │
├─────────────────────────────────────────────┤
│ [← 목록으로]                                │
│ 새 공지사항                                  │
│                                            │
│ ┌────────────────────────────────────────┐ │
│ │ 제목 *                                 │ │
│ │ [긴급 공지사항                        ] │ │
│ │                                        │ │
│ │ 긴급도 *                               │ │
│ │ [◯ 긴급 ◯ 중요 ◯ 일반 ◯ 정보]       │ │
│ │                                        │ │
│ │ 대상 항공사                             │ │
│ │ [☐ 전체] [☑ KAL] [☑ AAR] [☐ JJA]   │ │
│ │                                        │ │
│ │ 시작일 * [2026-02-22] [시간:분]        │ │
│ │ 종료일 * [2026-03-01] [시간:분]        │ │
│ │                                        │ │
│ │ 내용 *                                 │ │
│ │ ┌──────────────────────────────────┐ │ │
│ │ │                                  │ │ │
│ │ │ (Rich Text Editor)                │ │ │
│ │ │                                  │ │ │
│ │ └──────────────────────────────────┘ │ │
│ │                                        │ │
│ │ [미리보기] [저장] [취소]               │ │
│ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 5. React 컴포넌트 구조

```
src/components/announcements/
├── AnnouncementTable.tsx          # 공지사항 목록 테이블
│   - 필터링 (level, status)
│   - 페이지네이션
│   - 읽음/미읽 상태 표시
│   - 관리자/사용자 분기 처리
├── AnnouncementForm.tsx           # 공지사항 작성/수정 폼
│   - 제목, 내용 입력
│   - 항공사 선택 (다중 선택)
│   - 시작/종료일 선택
│   - 저장/취소 버튼
├── AnnouncementModal.tsx          # 공지사항 상세 모달
│   - 전체 내용 표시
│   - 읽음 상태 기록
│   - 조회 통계 (관리자)
└── AnnouncementStats.tsx          # 공지사항 통계 (신규)
    - 긴급도별 통계
    - 항공사별 조회율
    - 차트 (optional)
```

---

## 6. React Query Hooks

```typescript
// src/hooks/useAnnouncements.ts

// 사용자 쿼리
export function useAnnouncements(filters?: { page?: number; level?: string }) {
  return useQuery({
    queryKey: ['announcements', filters],
    queryFn: () => fetchAnnouncements(filters),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000
  });
}

export function useAnnouncementDetail(id: string) {
  return useQuery({
    queryKey: ['announcement', id],
    queryFn: () => fetchAnnouncementDetail(id),
    staleTime: 30000
  });
}

export function useMarkAsViewed(id: string) {
  return useMutation({
    mutationFn: () => markAnnouncementViewed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    }
  });
}

export function useAnnouncementHistory() {
  return useQuery({
    queryKey: ['announcements', 'history'],
    queryFn: fetchAnnouncementHistory,
    staleTime: 60000
  });
}

// 관리자 뮤테이션
export function useCreateAnnouncement() {
  return useMutation({
    mutationFn: (data: CreateAnnouncementRequest) => createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    }
  });
}

export function useUpdateAnnouncement(id: string) {
  return useMutation({
    mutationFn: (data: UpdateAnnouncementRequest) => updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
      queryClient.invalidateQueries({ queryKey: ['announcement', id] });
    }
  });
}

export function useDeleteAnnouncement() {
  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'announcements'] });
    }
  });
}
```

---

## 7. 페이지 라우트 구조

```
/announcements                    - 사용자 공지사항 목록
/announcements/[id]               - 공지사항 상세 조회

/admin/announcements              - 관리자 공지사항 대시보드
/admin/announcements/create       - 공지사항 작성
/admin/announcements/[id]         - 공지사항 상세/수정
/admin/announcements/[id]/stats   - 공지사항 통계
```

---

## 8. 보안 고려사항

### 8.1 인증 & 인가
- ✅ Bearer Token 기반 인증 (JWT)
- ✅ 관리자 API는 admin role 검증
- ✅ 사용자는 자신의 항공사 공지사항만 조회 가능
- ✅ 읽음 상태는 해당 사용자만 기록 가능

### 8.2 데이터 보호
- ✅ target_airlines 필터링으로 권한 없는 공지사항 차단
- ✅ is_active 플래그로 비활성 공지사항 숨김
- ✅ start_date/end_date 범위로 시간 기반 접근 제어

### 8.3 SQL Injection 방지
- ✅ Parameterized Queries 사용
- ✅ string_to_array() 사용 시 타입 체크

---

## 9. 구현 순서

1. **Phase 1**: Database Schema (announcements, announcement_views)
2. **Phase 2**: Type Definitions (Announcement, AnnouncementView, etc.)
3. **Phase 3**: API Endpoints
   - GET /api/announcements
   - GET /api/announcements/{id}
   - POST /api/announcements/{id}/view
   - GET /api/announcements/history
   - POST /api/admin/announcements
   - GET /api/admin/announcements
   - PATCH /api/admin/announcements/{id}
   - DELETE /api/admin/announcements/{id}
   - GET /api/admin/announcements/{id}/stats
4. **Phase 4**: React Query Hooks (useAnnouncements, useCreateAnnouncement, etc.)
5. **Phase 5**: React Components (AnnouncementTable, AnnouncementForm, AnnouncementModal)
6. **Phase 6**: Pages (/announcements, /announcements/[id], /admin/announcements, etc.)
7. **Phase 7**: Gap Analysis & Refinement

---

## 10. 참고 사항

### 기술 스택
- **Backend**: Next.js API Routes + PostgreSQL
- **Frontend**: React + TailwindCSS + Zustand + TanStack Query v5
- **Database**: PostgreSQL 11+
- **Authentication**: JWT (Bearer Token)

### 성능 최적화
- 공지사항 목록 페이지네이션 (20개씩)
- announcement_views 캐시 (viewCount 집계)
- Index: is_active, start_date, end_date, level

### 문서화 방식
- 한글 주석 + 영문 변수명
- SQL 쿼리 주석으로 필터링 로직 설명
- TypeScript 인터페이스로 스키마 명확화

---

## 11. 검증 기준

| 항목 | 기준 | 상태 |
|------|------|------|
| 데이터 무결성 | FK 제약 조건 + CHECK 제약 | ✓ |
| 성능 | 공지사항 조회 < 200ms | ⏳ |
| 보안 | SQL Injection 방지 + 권한 검증 | ✓ |
| UX | 읽음/미읽 구분 + 필터 기능 | ⏳ |
| 코드 품질 | TypeScript 타입 안정성 + 한글 주석 | ⏳ |

---

**Document Version**: 1.0
**Last Updated**: 2026-02-22
