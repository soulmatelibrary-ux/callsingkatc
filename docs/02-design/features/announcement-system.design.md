# Design: 공지사항 관리 시스템 (Phase 5)

**Feature**: announcement-system
**Level**: Dynamic (fullstack BaaS + Next.js)
**Date**: 2026-02-21
**Status**: Design Phase
**Based On**: announcement-system.plan.md

---

## 📐 시스템 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer (React)                      │
├─────────────────────────────────────────────────────────────────┤
│  AnnouncementModal  │  AnnouncementTable  │  AnnouncementForm    │
│  (popup 컴포넌트)   │  (이력 테이블)      │  (관리 폼)          │
└────────────────┬────────────────┬──────────────────┬─────────────┘
                 │                │                  │
                 ↓                ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Hooks Layer (TanStack Query)                   │
├─────────────────────────────────────────────────────────────────┤
│  Query Hooks:                         Mutation Hooks:            │
│  • useActiveAnnouncements()           • useViewAnnouncement()    │
│  • useAnnouncementHistory()           • useCreateAnnouncement()  │
│  • useAnnouncement(id)                • useUpdateAnnouncement()  │
│  • useAdminAnnouncements()            • useDeleteAnnouncement()  │
└────────────────┬────────────────┬──────────────────┬─────────────┘
                 │                │                  │
                 ↓                ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  User API:                        Admin API:                     │
│  • GET /api/announcements         • POST /api/admin/announcements
│  • GET /api/announcements/history • PATCH /api/admin/announcements/{id}
│  • GET /api/announcements/{id}    • DELETE /api/admin/announcements/{id}
│  • POST /api/announcements/{id}/view • GET /api/admin/announcements
└────────────────┬────────────────┬──────────────────┬─────────────┘
                 │                │                  │
                 ↓                ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Database Layer (PostgreSQL)                     │
├─────────────────────────────────────────────────────────────────┤
│  announcements table          announcement_views table           │
│  (공지사항 마스터)             (읽음 상태 추적)                   │
└─────────────────────────────────────────────────────────────────┘
```

### 컴포넌트 계층

```
Page Layer (src/app/)
├── /admin/announcements (관리자 관리 페이지)
│   ├── AnnouncementForm (생성/수정)
│   └── AnnouncementTable (관리 테이블)
├── /announcements (사용자 이력 페이지)
│   └── AnnouncementTable (이력 테이블)
└── RootLayout
    └── AnnouncementModal (전체 페이지에서 팝업)

Component Layer (src/components/)
├── AnnouncementModal
│   ├── 팝업 래퍼 (Dialog/Modal)
│   └── 공지사항 카드 렌더링
├── AnnouncementTable
│   ├── 테이블 헤더
│   ├── 테이블 바디 (행별 렌더링)
│   ├── 필터 바 (기간, 긴급도, 상태)
│   └── 페이지네이션
└── AnnouncementForm
    ├── 텍스트 입력 (제목, 내용)
    ├── 기간 선택 (start_date, end_date)
    ├── 긴급도 선택 (level)
    ├── 항공사 선택 (target_airlines)
    └── 버튼 (저장, 취소)

Hook Layer (src/hooks/)
├── Query Hooks
│   ├── useActiveAnnouncements()
│   ├── useAnnouncementHistory()
│   ├── useAnnouncement(id)
│   └── useAdminAnnouncements()
└── Mutation Hooks
    ├── useViewAnnouncement()
    ├── useCreateAnnouncement()
    ├── useUpdateAnnouncement()
    └── useDeleteAnnouncement()
```

---

## 📊 데이터 흐름 (Data Flow)

### 1. 공지사항 팝업 표시 흐름

```
User Login
    ↓
RootLayout renders
    ↓
AnnouncementModal mounts
    ↓
useActiveAnnouncements() 호출
    ↓
GET /api/announcements 요청
    ├── 인증 확인 (Bearer token)
    ├── user.airline_id 조회
    ├── DB query:
    │   SELECT * FROM announcements
    │   WHERE start_date <= NOW() <= end_date
    │   AND is_active = true
    │   AND (target_airlines IS NULL OR user.airline_id IN target_airlines)
    └── 결과 반환 (JSON)
    ↓
AnnouncementModal state 업데이트
    ↓
Render modal (긴급도별 색상)
    ↓
User clicks "닫기" or reads
    ↓
Session storage 에 dismissed 저장
    ↓
Modal 다시 show X (this session)
```

### 2. 공지사항 생성 흐름 (Admin)

```
Admin inputs form
    ↓
useCreateAnnouncement() 호출
    ↓
POST /api/admin/announcements 요청
    ├── 인증 확인 + role=admin 검증
    ├── 데이터 유효성 검사
    │   ├── title, content 필수
    │   ├── start_date < end_date 검증
    │   └── level in ['warning', 'info', 'success']
    ├── DB insert:
    │   INSERT INTO announcements (...)
    │   VALUES (title, content, level, start_date, end_date, target_airlines, created_by)
    ├── 캐시 무효화 (useAdminAnnouncements)
    └── 성공 응답 (id 반환)
    ↓
Success toast + redirect to list
```

### 3. 공지사항 읽음 상태 기록 흐름

```
User views announcement detail
    ↓
useViewAnnouncement() 호출
    ↓
POST /api/announcements/{id}/view 요청
    ├── 인증 확인
    ├── DB upsert:
    │   INSERT INTO announcement_views (announcement_id, user_id, viewed_at)
    │   ON CONFLICT (announcement_id, user_id) DO UPDATE SET viewed_at = NOW()
    └── 200 OK 응답
```

### 4. 공지사항 이력 조회 흐름

```
User navigates to /announcements
    ↓
useAnnouncementHistory() 호출
    ↓
GET /api/announcements/history?level=&status=&dateFrom=&dateTo=&page=1 요청
    ├── 인증 확인
    ├── user.airline_id 필터링
    ├── DB query with filters:
    │   SELECT * FROM announcements
    │   WHERE (target_airlines IS NULL OR user.airline_id IN target_airlines)
    │   AND (...filters applied...)
    │   ORDER BY start_date DESC
    │   LIMIT 20 OFFSET 0
    ├── view count 조회 (LEFT JOIN announcement_views)
    └── 페이지네이션 메타 반환
    ↓
AnnouncementTable 렌더링 (읽음 여부 표시)
```

---

## 🔗 상태 관리 아키텍처

### Zustand (인증 상태)

```typescript
// 기존 useAuthStore 활용
const authStore = useAuthStore();
// {
//   user: { id, email, airline_id, role },
//   accessToken,
//   ...
// }
```

### React Query (캐싱 전략)

```typescript
// Query Key Structure
const queryKeys = {
  announcements: {
    active: () => ['announcements', 'active'],
    history: (filters) => ['announcements', 'history', filters],
    detail: (id) => ['announcements', id],
  },
  admin: {
    announcements: (filters) => ['admin', 'announcements', filters],
  }
};

// Stale Time & GC Time
const queryConfig = {
  staleTime: 30 * 1000,      // 30초
  gcTime: 5 * 60 * 1000,     // 5분
  retry: 1,
};
```

### Session Storage (팝업 상태)

```typescript
// 팝업 닫음 상태 저장 (sessionStorage 활용)
sessionStorage.setItem('dismissedAnnouncements', JSON.stringify([id1, id2, ...]));

// 페이지 새로고침 시 자동 초기화
// (sessionStorage는 탭 닫으면 자동 제거)
```

---

## 🏗️ API 클라이언트 설계

### Hooks 구조 (src/hooks/useAnnouncements.ts)

```typescript
// 1. Query Hooks
export const useActiveAnnouncements = () => {
  const { accessToken, user } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.announcements.active(),
    queryFn: async () => {
      const res = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json();
    },
    staleTime: 30000,
    enabled: !!accessToken, // 로그인 후에만 실행
  });
};

export const useAnnouncementHistory = (filters) => {
  const { accessToken } = useAuthStore();
  const queryString = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: queryKeys.announcements.history(filters),
    queryFn: async () => {
      const res = await fetch(`/api/announcements/history?${queryString}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json();
    },
    staleTime: 30000,
  });
};

export const useAnnouncement = (id) => {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: queryKeys.announcements.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/announcements/${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json();
    },
  });
};

// 2. Mutation Hooks
export const useViewAnnouncement = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/announcements/${id}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.announcements.detail(id)
      });
    }
  });
};

export const useCreateAnnouncement = () => {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.announcements({})
      });
    }
  });
};

// useUpdateAnnouncement, useDeleteAnnouncement 동일 패턴
```

### Admin Hooks

```typescript
export const useAdminAnnouncements = (filters) => {
  const { accessToken } = useAuthStore();
  const queryString = new URLSearchParams(filters).toString();
  return useQuery({
    queryKey: queryKeys.admin.announcements(filters),
    queryFn: async () => {
      const res = await fetch(`/api/admin/announcements?${queryString}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      return res.json();
    },
    staleTime: 30000,
  });
};
```

---

## 🔐 권한 검증 플로우

### API Route 패턴 (src/app/api/)

```typescript
// 1. User API Route (GET /api/announcements)
export async function GET(req) {
  try {
    // 1-1. 인증 검증
    const token = req.headers.get('authorization')?.substring(7);
    if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyJWT(token); // 기존 함수 재사용
    if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 });

    // 1-2. 사용자 정보 조회
    const user = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

    // 1-3. 활성 공지사항 조회 (airline_id 필터)
    const announcements = await db.query(`
      SELECT * FROM announcements
      WHERE start_date <= NOW() AND end_date >= NOW()
      AND is_active = true
      AND (target_airlines IS NULL OR $1 = ANY(string_to_array(target_airlines, ',')))
      ORDER BY start_date DESC
    `, [user.airline_id]);

    return Response.json({ announcements });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// 2. Admin API Route (POST /api/admin/announcements)
export async function POST(req) {
  try {
    // 2-1. 인증 + admin role 검증
    const token = req.headers.get('authorization')?.substring(7);
    const payload = verifyJWT(token);
    if (!payload || payload.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2-2. 요청 데이터 유효성 검사
    const data = await req.json();
    if (!data.title || !data.content || !data.startDate || !data.endDate) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2-3. 시간 검증 (start_date < end_date)
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return Response.json({ error: 'start_date must be before end_date' }, { status: 400 });
    }

    // 2-4. DB 저장
    const result = await db.query(`
      INSERT INTO announcements (title, content, level, start_date, end_date,
                                  target_airlines, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      data.title,
      data.content,
      data.level || 'info',
      data.startDate,
      data.endDate,
      data.targetAirlines ? data.targetAirlines.join(',') : null,
      payload.sub
    ]);

    return Response.json({ id: result[0].id }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
```

---

## 🎨 UI 컴포넌트 설계

### AnnouncementModal 컴포넌트

```typescript
// src/components/announcements/AnnouncementModal.tsx
export function AnnouncementModal() {
  const { data: announcements = [] } = useActiveAnnouncements();
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Session storage에서 dismissed 상태 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('dismissedAnnouncements');
    if (saved) setDismissed(JSON.parse(saved));
  }, []);

  // 첫 번째 미닫음 공지사항 찾기
  const toShow = announcements.find(a => !dismissed.includes(a.id));

  if (!toShow) return null; // 표시할 공지사항 없음

  const handleDismiss = () => {
    const updated = [...dismissed, toShow.id];
    setDismissed(updated);
    sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(updated));
  };

  // 긴급도별 색상
  const levelColors = {
    warning: 'bg-red-50 border-red-300 text-red-900',
    info: 'bg-blue-50 border-blue-300 text-blue-900',
    success: 'bg-green-50 border-green-300 text-green-900'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`rounded-lg border-2 p-6 max-w-md ${levelColors[toShow.level]}`}>
        <h2 className="text-lg font-bold mb-2">{toShow.title}</h2>
        <p className="text-sm mb-4">{toShow.content}</p>
        <div className="flex gap-2">
          <button onClick={handleDismiss} className="flex-1 bg-gray-300 px-4 py-2 rounded">
            닫기
          </button>
          <a href={`/announcements/${toShow.id}`} className="flex-1 bg-blue-500 text-white px-4 py-2 rounded">
            자세히
          </a>
        </div>
      </div>
    </div>
  );
}
```

### AnnouncementTable 컴포넌트

```typescript
// src/components/announcements/AnnouncementTable.tsx
interface Props {
  isAdmin?: boolean;
}

export function AnnouncementTable({ isAdmin = false }: Props) {
  const [filters, setFilters] = useState({
    level: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20
  });

  const { data: announcements = [] } = isAdmin
    ? useAdminAnnouncements(filters)
    : useAnnouncementHistory(filters);

  // 테이블 렌더링 (Tailwind 그리드)
  // 필터 바, 테이블 바디, 페이지네이션
}
```

### AnnouncementForm 컴포넌트

```typescript
// src/components/announcements/AnnouncementForm.tsx
export function AnnouncementForm({ announcement }: { announcement?: Announcement }) {
  const [form, setForm] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    level: announcement?.level || 'info',
    startDate: announcement?.startDate || '',
    endDate: announcement?.endDate || '',
    targetAirlines: announcement?.targetAirlines || []
  });

  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (announcement) {
      await updateMutation.mutateAsync({ id: announcement.id, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="공지사항 제목"
        className="w-full border rounded px-3 py-2"
      />
      <textarea
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        placeholder="공지사항 내용"
        className="w-full border rounded px-3 py-2 h-32"
      />
      <select
        value={form.level}
        onChange={(e) => setForm({ ...form, level: e.target.value })}
        className="border rounded px-3 py-2"
      >
        <option value="info">일반</option>
        <option value="warning">경고</option>
        <option value="success">완료</option>
      </select>
      <input
        type="datetime-local"
        value={form.startDate}
        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        className="border rounded px-3 py-2 w-full"
      />
      <input
        type="datetime-local"
        value={form.endDate}
        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        className="border rounded px-3 py-2 w-full"
      />
      <button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}
```

---

## 📝 구현 순서 (Implementation Order)

### Phase 1: Database & API (1일)

1. **DB 마이그레이션** (scripts/init.sql)
   - `announcements` 테이블 생성
   - `announcement_views` 테이블 생성
   - 샘플 데이터 (3-5개) 추가
   - 우선순위: **높음** ⭐

2. **API Routes 구현** (src/app/api/)
   - `GET /api/announcements` - 활성 공지사항
   - `GET /api/announcements/history` - 이력
   - `GET /api/announcements/{id}` - 상세
   - `POST /api/announcements/{id}/view` - 읽음 기록
   - `POST /api/admin/announcements` - 생성
   - `PATCH /api/admin/announcements/{id}` - 수정
   - `DELETE /api/admin/announcements/{id}` - 삭제
   - `GET /api/admin/announcements` - 관리자 목록
   - 우선순위: **높음** ⭐

### Phase 2: Hooks & Client (1일)

3. **React Query Hooks** (src/hooks/useAnnouncements.ts)
   - Query hooks (4개)
   - Mutation hooks (4개)
   - TanStack Query v5 설정
   - 우선순위: **높음** ⭐

4. **상수 및 타입** (src/lib/constants.ts, src/types/announcement.ts)
   - Query keys 상수
   - Type definitions (Announcement, AnnouncementView)
   - API response types
   - 우선순위: **중** ⭐

### Phase 3: Components & Pages (1일)

5. **컴포넌트 구현** (src/components/announcements/)
   - `AnnouncementModal` - 팝업 (모든 페이지 적용)
   - `AnnouncementTable` - 이력 테이블
   - `AnnouncementForm` - 생성/수정 폼
   - 우선순위: **높음** ⭐

6. **페이지 구현** (src/app/)
   - `/announcements` - 사용자 이력 페이지
   - `/admin/announcements` - 관리자 관리 페이지
   - RootLayout에 `AnnouncementModal` 통합
   - 우선순위: **높음** ⭐

### Phase 4: Testing & Polish (0.5일)

7. **테스트 및 검증**
   - API 테스트 (Zero Script QA)
   - 권한 검증 테스트
   - 기간 필터 테스트
   - UI/UX 점검
   - 우선순위: **중** ⭐

---

## 🔧 기술 상세

### 상수 정의 (src/lib/constants.ts)

```typescript
export const ANNOUNCEMENT_LEVELS = {
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
} as const;

export const ANNOUNCEMENT_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired'
} as const;

export const ROUTES = {
  // ...existing
  ANNOUNCEMENTS: '/announcements',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements'
};
```

### 타입 정의 (src/types/announcement.ts)

```typescript
export interface Announcement {
  id: string;
  title: string;
  content: string;
  level: 'warning' | 'info' | 'success';
  startDate: string;        // ISO 8601
  endDate: string;          // ISO 8601
  targetAirlines?: string[]; // null = 전체
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AnnouncementView {
  id: string;
  announcementId: string;
  userId: string;
  viewedAt: string;
  dismissedAt?: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  level: 'warning' | 'info' | 'success';
  startDate: string;
  endDate: string;
  targetAirlines?: string[];
}

export interface AnnouncementListResponse {
  announcements: Announcement[];
  total: number;
  page: number;
  limit: number;
}
```

### 오류 처리 (Error Handling)

```typescript
// API 오류 코드
export enum AnnouncementErrorCode {
  UNAUTHORIZED = 401,           // 인증 필요
  FORBIDDEN = 403,              // 권한 없음 (admin only)
  NOT_FOUND = 404,              // 공지사항 없음
  INVALID_DATE_RANGE = 400,     // start_date >= end_date
  MISSING_FIELDS = 400,         // 필수 필드 없음
  INTERNAL_ERROR = 500
}

// 클라이언트 오류 처리
const handleError = (error) => {
  switch (error.status) {
    case 401:
      // 로그인 페이지로 이동
      break;
    case 403:
      // 권한 부족 메시지 표시
      break;
    case 404:
      // 공지사항 없음 메시지
      break;
    default:
      // 일반 오류 메시지
  }
};
```

### 보안 고려사항 (Security)

1. **RBAC (Role-Based Access Control)**
   - Admin API: `role = 'admin'` 필수 검증
   - User API: `airline_id` 기반 필터링

2. **입력 검증**
   - SQL Injection 방지: Parameterized queries 사용
   - XSS 방지: 사용자 입력 sanitization
   - CSRF 방지: CORS 정책, SameSite cookie

3. **토큰 검증**
   - JWT 만료 확인
   - Bearer token 유효성 검증
   - 401 에러 시 자동 토큰 갱신 (기존 구현)

4. **데이터 접근 제어**
   - 자신의 항공사 공지사항만 조회
   - 관리자는 전체 조회 가능
   - 읽음 상태는 자신 것만 기록

---

## 📈 성능 고려사항

### 쿼리 최적화

```sql
-- 활성 공지사항 조회 (인덱스 활용)
CREATE INDEX idx_announcements_active
ON announcements(start_date, end_date, is_active);

-- 사용자 항공사 필터링
CREATE INDEX idx_announcements_airlines
ON announcements(target_airlines);

-- 읽음 상태 조회
CREATE INDEX idx_announcement_views_unique
ON announcement_views(announcement_id, user_id);
```

### 캐싱 전략

```typescript
// TanStack Query 설정
staleTime: 30 * 1000,    // 30초 후 stale 표시
gcTime: 5 * 60 * 1000,   // 5분 후 가비지 수집

// 뮤테이션 성공 시 자동 무효화
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.admin.announcements({})
  });
}
```

### 페이지네이션

```typescript
// API: limit=20, offset=0 기본값
// 대량 공지사항 조회 시 성능 저하 방지
```

---

## 🧪 테스트 전략

### API 테스트 (Zero Script QA)

```bash
# 1. 활성 공지사항 조회 (사용자)
GET /api/announcements
Authorization: Bearer {userToken}

# 기대 결과:
# - 현재 시간 범위 내 공지사항만 반환
# - user.airline_id 기반 필터링됨
# - 읽음 여부 표시

# 2. 공지사항 생성 (관리자만)
POST /api/admin/announcements
Authorization: Bearer {adminToken}
Body: { title, content, level, startDate, endDate, targetAirlines }

# 기대 결과:
# - 201 Created
# - id 반환

# 3. 관리자가 아닌 사용자 생성 시도
POST /api/admin/announcements
Authorization: Bearer {userToken}

# 기대 결과:
# - 403 Forbidden
```

---

## 🔄 다음 단계

- Design 완료 후 Do 단계로 진행
- 구현 체크리스트: 8개 파일 생성/수정 필요
- 예상 기간: 1-2일

---

## ✅ Design 체크리스트

- [x] 시스템 아키텍처 설계 (컴포넌트 계층)
- [x] 데이터 흐름 정의 (4개 주요 플로우)
- [x] 상태 관리 설계 (Zustand + React Query)
- [x] API 클라이언트 설계 (8개 훅)
- [x] 권한 검증 플로우 (RBAC)
- [x] UI 컴포넌트 설계 (3개 컴포넌트)
- [x] 구현 순서 명시 (7단계, 우선순위)
- [x] 기술 상세 (타입, 상수, 오류 처리)
- [x] 성능 고려사항 (인덱싱, 캐싱)
- [x] 보안 고려사항 (RBAC, 입력 검증)

**다음 단계**: Do 단계 실행 → `/pdca do announcement-system`
