# Callsign Management V1 - 설계 문서

> **Summary**: 관리자 통합 대시보드 상세 설계 - 기존 UI 스타일 준수 (rounded-none, navy primary)
>
> **Project**: KATC1 항공사 유사호출부호 경고시스템
> **Version**: 1.0.0
> **Date**: 2026-02-22
> **Status**: Design Phase
> **Reference Plan**: `/docs/01-plan/features/callsign-management-v1.plan.md`

---

## 1. 설계 개요 (Design Overview)

### 1.1 디자인 원칙 (Design Principles)

✅ **기존 스타일 유지**
- 모서리: `rounded-none` (직각)
- 컴포넌트: 그림자 + 보더 조합 (`shadow-sm border border-gray-100`)
- 색상: Primary (navy 계열), Gray 톤
- 타이포그래피: Bold + UpperCase 라벨 (`text-[10px] font-black uppercase tracking-widest`)

✅ **공간 구조**
- 최대 너비: `max-w-7xl mx-auto`
- 패딩: `px-6 pt-8 pb-10`
- 간격: `space-y-8`, `gap-6`, `gap-8`
- Grid: 반응형 (1 → sm:3 → lg:자동)

✅ **상호작용**
- Hover: `hover:shadow-xl`, `group-hover:bg-primary/[0.02]`
- 전환: `transition-all duration-300`
- 로딩: 회전 스피너 (`animate-spin`)

---

## 2. 페이지 구조 (Page Architecture)

### 2.1 URL 및 라우팅

```
GET /admin/callsign-mgmt-v1
  ↓
src/app/admin/callsign-mgmt-v1/page.tsx (메인 페이지)
```

### 2.2 레이아웃 구조

```
<Body bg-[#f8fafc]>
  <MainContainer max-w-7xl mx-auto px-6 pt-8 pb-10>
    ├─ [페이지 헤더]
    │  ├─ 제목 라인 (파랑 바 + "SYSTEM MANAGEMENT" 텍스트)
    │  ├─ 제목 (h1: "유사호출부호 관리 V1")
    │  └─ 설명
    │
    ├─ [메인 콘텐츠 격자]
    │  ├─ 왼쪽 (lg:col-span-4)
    │  │  └─ <TabsContainer>
    │  │     ├─ 탭 버튼 (3개: 전체현황, 항공사조치, 통계)
    │  │     └─ 탭 콘텐츠 영역
    │  │
    │  └─ 오른쪽 (lg:col-span-2)
    │     └─ <Sidebar>
    │        ├─ 파일 업로드 섹션
    │        ├─ 업로드 결과
    │        └─ 업로드 이력
    │
    └─ [푸터 (여유)]
```

---

## 3. 컴포넌트 설계 (Component Design)

### 3.1 페이지 헤더 (Page Header)

**위치**: 페이지 상단
**구조**:
```jsx
<div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
  <div>
    <div className="flex items-center gap-2 mb-2">
      <span className="w-8 h-1 bg-primary rounded-full" />
      <span className="text-primary font-bold text-sm tracking-widest uppercase">
        System Management
      </span>
    </div>
    <h1 className="text-4xl font-black text-gray-900 tracking-tight">
      유사호출부호 관리 V1
    </h1>
    <p className="mt-2 text-gray-500 font-medium">
      항공교통본부 관리자 통합 대시보드 - 유사호출부호 업로드 및 항공사 조치 현황
    </p>
  </div>
</div>
```

**색상**: text-primary (navy), text-gray-900, border-gray-200

---

### 3.2 탭 컨테이너 (Tabs Container)

**위치**: 메인 콘텐츠 왼쪽
**구조**:
```jsx
<div className="bg-white rounded-none shadow-sm border border-gray-100">
  {/* 탭 헤더 */}
  <div className="flex border-b border-gray-100">
    <button
      className="flex-1 px-6 py-4 font-bold text-center border-b-2 border-primary text-primary"
    >
      전체현황
    </button>
    <button
      className="flex-1 px-6 py-4 font-bold text-center border-b-2 border-transparent text-gray-500 hover:text-gray-900"
    >
      항공사조치
    </button>
    <button
      className="flex-1 px-6 py-4 font-bold text-center border-b-2 border-transparent text-gray-500 hover:text-gray-900"
    >
      통계
    </button>
  </div>

  {/* 탭 콘텐츠 */}
  <div className="p-8">
    {/* 활성 탭 내용 렌더링 */}
  </div>
</div>
```

**색상**:
- 활성: `border-primary text-primary`
- 비활성: `border-transparent text-gray-500 hover:text-gray-900`

---

### 3.3 KPI 카드 (Stat Card)

**재사용**: 기존 `PremiumStatCard` 컴포넌트 패턴
**구조**:
```jsx
<div className="group relative bg-white rounded-none p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
  <div className="relative flex justify-between items-start">
    <div>
      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={`text-4xl font-black ${color} tracking-tighter`}>
        {value.toLocaleString()}
      </p>
    </div>
    {icon && <IconElement />}
  </div>
  <div className="mt-4 flex items-center gap-1">
    <span className="text-[10px] font-bold text-gray-400">Description</span>
    <div className="h-[1px] flex-1 bg-gray-100" />
  </div>
</div>
```

**색상 변수**:
- Gray: `text-gray-900`
- Emerald (완료): `text-emerald-600`
- Amber (진행중): `text-amber-600`
- Rose (미조치): `text-rose-600`
- Red (위험): `text-red-600`

---

### 3.4 탭1: 전체현황 (Overview Tab)

**콘텐츠**:

#### 3.4.1 KPI 섹션 (5개 카드)
```
Grid: grid-cols-1 sm:grid-cols-5 gap-6

┌─────────────────────┐
│  총 호출부호        │  (gray-900)
│  245개              │
└─────────────────────┘

┌─────────────────────┐
│  매우높음           │  (red-600)
│  89개               │
└─────────────────────┘

┌─────────────────────┐
│  높음               │  (amber-600)
│  120개              │
└─────────────────────┘

┌─────────────────────┐
│  낮음               │  (emerald-600)
│  36개               │
└─────────────────────┘

┌─────────────────────┐
│  진행중             │  (blue-600)
│  156개              │
└─────────────────────┘
```

#### 3.4.2 호출부호 테이블 섹션
```jsx
<div className="mt-8 bg-white rounded-none shadow-sm border border-gray-100">
  {/* 헤더 */}
  <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
    <div>
      <h3 className="text-xl font-black text-gray-900 tracking-tight">
        호출부호 목록
      </h3>
      <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">
        Call Signs List
      </p>
    </div>
    <button className="px-4 py-2 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">
      초기화
    </button>
  </div>

  {/* 필터 */}
  <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FilterSelect label="항공사" options={airlines} />
      <FilterSelect label="위험도" options={riskLevels} />
      <FilterSelect label="상태" options={statuses} />
      <SearchInput placeholder="호출부호 검색..." />
    </div>
  </div>

  {/* 테이블 */}
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-white">
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
            항공사
          </th>
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
            호출부호
          </th>
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
            위험도
          </th>
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
            상태
          </th>
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">
            등록일
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {/* 행 반복 */}
        <tr className="group hover:bg-primary/[0.02] transition-all">
          <td className="px-8 py-5 font-bold text-gray-900">KAL</td>
          <td className="px-8 py-5 font-medium text-gray-700">KAL852 ↔ AAR852</td>
          <td className="px-8 py-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-100">
              높음
            </span>
          </td>
          <td className="px-8 py-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
              진행중
            </span>
          </td>
          <td className="px-8 py-5 text-gray-400 font-medium">02-22</td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* 페이지네이션 */}
  <div className="px-8 py-6 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
      페이지 1 / 5 (총 245개)
    </span>
    <div className="flex gap-2">
      <button className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50">
        이전
      </button>
      <button className="px-3 py-1 border border-gray-200 rounded-none hover:bg-gray-50">
        다음
      </button>
    </div>
  </div>
</div>
```

---

### 3.5 탭2: 항공사조치 (Actions Tab)

#### 3.5.1 항공사 현황 테이블

```jsx
<div className="bg-white rounded-none shadow-sm border border-gray-100">
  {/* 헤더 */}
  <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
    <h3 className="text-xl font-black text-gray-900 tracking-tight">
      항공사 조치 현황
    </h3>
  </div>

  {/* 테이블 */}
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-white">
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
            항공사
          </th>
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
            호출부호
          </th>
          <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
            조치율
          </th>
          <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
            대기
          </th>
          <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
            진행중
          </th>
          <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
            완료
          </th>
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
            상태
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        <tr className="group hover:bg-primary/[0.02]">
          <td className="px-8 py-5 font-bold text-gray-900">KAL</td>
          <td className="px-8 py-5 font-medium text-gray-600">15개</td>
          <td className="px-8 py-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{width: '93%'}} />
              </div>
              <span className="font-bold text-emerald-600">93%</span>
            </div>
          </td>
          <td className="px-8 py-5 text-center font-bold text-amber-600">1</td>
          <td className="px-8 py-5 text-center font-bold text-blue-600">0</td>
          <td className="px-8 py-5 text-center font-bold text-emerald-600">14</td>
          <td className="px-8 py-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
              우수
            </span>
          </td>
        </tr>
        {/* OZ 항공사: 75% 황색 */}
        <tr className="group hover:bg-primary/[0.02]">
          <td className="px-8 py-5 font-bold text-gray-900">OZ</td>
          <td className="px-8 py-5 font-medium text-gray-600">12개</td>
          <td className="px-8 py-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{width: '75%'}} />
              </div>
              <span className="font-bold text-amber-600">75%</span>
            </div>
          </td>
          <td className="px-8 py-5 text-center font-bold text-amber-600">3</td>
          <td className="px-8 py-5 text-center font-bold text-blue-600">6</td>
          <td className="px-8 py-5 text-center font-bold text-emerald-600">3</td>
          <td className="px-8 py-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-100">
              양호
            </span>
          </td>
        </tr>
        {/* AAR 항공사: 33% 빨강 */}
        <tr className="group hover:bg-primary/[0.02]">
          <td className="px-8 py-5 font-bold text-gray-900">AAR</td>
          <td className="px-8 py-5 font-medium text-gray-600">6개</td>
          <td className="px-8 py-5 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{width: '33%'}} />
              </div>
              <span className="font-bold text-red-600">33%</span>
            </div>
          </td>
          <td className="px-8 py-5 text-center font-bold text-amber-600">4</td>
          <td className="px-8 py-5 text-center font-bold text-blue-600">2</td>
          <td className="px-8 py-5 text-center font-bold text-emerald-600">0</td>
          <td className="px-8 py-5">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-100">
              주의
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* 푸터 */}
  <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex justify-end gap-3">
    <button className="px-6 py-2 bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 rounded-none">
      초기화
    </button>
    <button className="px-6 py-2 bg-primary text-white font-bold hover:opacity-90 rounded-none">
      📊 Excel 내보내기
    </button>
  </div>
</div>
```

**상태 색상 규칙**:
- 🟢 초록 (80%+): `bg-emerald-50 text-emerald-600` - "우수"
- 🟡 황색 (50-80%): `bg-amber-50 text-amber-600` - "양호"
- 🔴 빨강 (<50%): `bg-red-50 text-red-600` - "주의"

---

### 3.6 탭3: 통계 (Statistics Tab)

#### 3.6.1 KPI 카드 (4개)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <PremiumStatCard label="총 호출부호" value={245} color="text-gray-900" />
  <PremiumStatCard label="미조치 (Pending)" value={29} color="text-amber-600" />
  <PremiumStatCard label="진행중 (In Progress)" value={88} color="text-blue-600" />
  <PremiumStatCard label="완료 (Completed)" value={127} color="text-emerald-600" />
</div>
```

#### 3.6.2 차트 섹션

```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
  {/* 좌측: 위험도별 현황 */}
  <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
    <h3 className="text-lg font-black text-gray-900 mb-6">위험도별 현황</h3>
    {/* Recharts BarChart 또는 SVG */}
  </div>

  {/* 우측: 항공사별 조치율 */}
  <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
    <h3 className="text-lg font-black text-gray-900 mb-6">항공사별 조치율</h3>
    {/* Recharts BarChart (horizontal) 또는 SVG */}
  </div>
</div>
```

#### 3.6.3 항공사별 상세 통계 테이블

```jsx
<div className="bg-white rounded-none shadow-sm border border-gray-100">
  {/* 헤더 */}
  <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
    <h3 className="text-xl font-black text-gray-900">항공사별 상세 통계</h3>
  </div>

  {/* 테이블 */}
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-white">
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
            항공사
          </th>
          <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
            호출부호
          </th>
          <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
            조치율
          </th>
          <th className="px-8 py-4 text-center text-[11px] font-black text-gray-400 uppercase">
            평균 대응시간
          </th>
          <th className="px-8 py-4 text-left text-[11px] font-black text-gray-400 uppercase">
            최근 업로드
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        <tr className="group hover:bg-primary/[0.02]">
          <td className="px-8 py-5 font-bold text-gray-900">KAL</td>
          <td className="px-8 py-5 text-center font-medium text-gray-600">15개</td>
          <td className="px-8 py-5 text-center font-bold text-emerald-600">93%</td>
          <td className="px-8 py-5 text-center text-gray-600 font-medium">5.2일</td>
          <td className="px-8 py-5 text-gray-600 font-medium">2026-02-22</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

### 3.7 오른쪽 사이드바 (Sidebar)

**위치**: 메인 콘텐츠 오른쪽 (lg:col-span-2)
**스타일**: `space-y-6` (섹션 간 공간)

#### 3.7.1 파일 업로드 섹션

```jsx
<div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
  <h3 className="text-lg font-black text-gray-900 mb-6">📁 엑셀 업로드</h3>

  {/* 드래그 앤 드롭 영역 */}
  <div
    className="relative border-2 border-dashed border-gray-300 rounded-none p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
    onDrop={handleDrop}
    onDragOver={handleDragOver}
  >
    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
    </svg>
    <p className="text-sm font-bold text-gray-600 mb-2">
      파일을 드래그하거나 클릭해서 선택
    </p>
    <p className="text-xs text-gray-400">
      .xlsx, .xls 파일만 지원 (최대 10MB)
    </p>
    <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" />
  </div>

  {/* 진행률 (업로드 중일 때만) */}
  {isUploading && (
    <div className="mt-4">
      <div className="flex items-center gap-3 mb-2">
        <svg className="w-4 h-4 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-sm font-bold text-gray-700">처리 중... {progress}%</span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{width: `${progress}%`}} />
      </div>
    </div>
  )}
</div>
```

#### 3.7.2 업로드 결과 섹션 (완료 후)

```jsx
{uploadResult && (
  <div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
    <div className="flex items-center gap-3 mb-4">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50">
        <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </span>
      <h3 className="text-lg font-black text-gray-900">업로드 완료</h3>
    </div>

    <div className="space-y-3">
      <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-none border border-emerald-100">
        <span className="text-sm font-bold text-gray-700">추가</span>
        <span className="text-lg font-black text-emerald-600">15개</span>
      </div>
      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-none border border-blue-100">
        <span className="text-sm font-bold text-gray-700">수정</span>
        <span className="text-lg font-black text-blue-600">8개</span>
      </div>
      <div className="flex justify-between items-center p-3 bg-red-50 rounded-none border border-red-100">
        <span className="text-sm font-bold text-gray-700">실패</span>
        <span className="text-lg font-black text-red-600">2개</span>
      </div>
    </div>

    {uploadResult.errors.length > 0 && (
      <details className="mt-4 border-t border-gray-100 pt-4">
        <summary className="text-sm font-bold text-gray-700 cursor-pointer">
          오류 상세보기
        </summary>
        <div className="mt-3 space-y-2 bg-red-50 p-3 rounded-none max-h-48 overflow-y-auto">
          {uploadResult.errors.slice(0, 10).map((err, idx) => (
            <p key={idx} className="text-xs text-red-700">
              <strong>Row {err.row}:</strong> {err.message}
            </p>
          ))}
        </div>
      </details>
    )}
  </div>
)}
```

#### 3.7.3 업로드 이력 섹션

```jsx
<div className="bg-white rounded-none shadow-sm border border-gray-100 p-8">
  <h3 className="text-lg font-black text-gray-900 mb-4">📋 업로드 이력</h3>

  <div className="space-y-3 max-h-64 overflow-y-auto">
    {uploadHistory.map((item, idx) => (
      <div key={idx} className="p-4 bg-gray-50 rounded-none border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer group">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="font-bold text-sm text-gray-900 group-hover:text-primary">
              {item.fileName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(item.uploadedAt).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            item.failedCount === 0
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-600'
          }`}>
            {item.totalRows}건
          </span>
        </div>
        <div className="mt-2 flex gap-2 text-[10px] font-bold text-gray-500">
          <span>성공: {item.successCount}</span>
          {item.failedCount > 0 && <span className="text-red-600">실패: {item.failedCount}</span>}
        </div>
      </div>
    ))}
  </div>

  {uploadHistory.length === 0 && (
    <p className="text-center text-sm text-gray-400 py-6">
      업로드 이력이 없습니다
    </p>
  )}
</div>
```

---

## 4. 데이터 바인딩 (Data Binding)

### 4.1 API 엔드포인트 매핑

| 탭 | 기능 | 엔드포인트 | Hook |
|-----|------|---------|------|
| 전체현황 | 호출부호 목록 | GET /api/callsigns | useCallsigns() |
| 전체현황 | 호출부호 통계 | GET /api/admin/statistics?type=summary | useStatistics() |
| 항공사조치 | 항공사별 현황 | GET /api/admin/statistics?type=airline | useAirlineStats() |
| 통계 | 전체 요약 | GET /api/admin/statistics?type=summary | useStatistics() |
| 통계 | 차트 데이터 | GET /api/admin/statistics?type=chart | useChartData() |
| 사이드 | 엑셀 업로드 | POST /api/admin/uploads | useUploadFile() |
| 사이드 | 업로드 이력 | GET /api/admin/uploads/history | useUploadHistory() |

### 4.2 상태 관리 (State Management)

```tsx
// /src/app/admin/callsign-mgmt-v1/page.tsx

'use client';

import { useState } from 'react';
import { useCallsigns, useStatistics, useUploadFile } from '@/hooks/useActions';

export default function CallsignMgmtV1Page() {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'stats'>('overview');

  // 필터 상태
  const [selectedAirline, setSelectedAirline] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);

  // 데이터 쿼리
  const callsignsQuery = useCallsigns({
    airlineId: selectedAirline || undefined,
    riskLevel: selectedRiskLevel || undefined,
    status: selectedStatus || undefined,
    page,
    limit: 20,
  });

  const statsQuery = useStatistics('summary');

  // 업로드 뮤테이션
  const uploadMutation = useUploadFile();

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-full">
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-8 pb-10 space-y-8">
        {/* 페이지 헤더 */}
        {/* ... */}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 탭 콘텐츠 (lg:col-span-2 또는 lg:col-span-3) */}
          {/* ... */}

          {/* 사이드바 (lg:col-span-2 또는 lg:col-span-1) */}
          {/* ... */}
        </div>
      </main>
    </div>
  );
}
```

---

## 5. 색상 팔레트 (Color Palette)

### 5.1 기본 색상

```css
/* Primary */
--primary: navy / #0f172a (text-primary, bg-primary)

/* Background */
--bg-page: #f8fafc (bg-[#f8fafc])

/* Gray Scale */
--gray-900: #111827
--gray-700: #374151
--gray-600: #4b5563
--gray-500: #6b7280
--gray-400: #9ca3af
--gray-200: #e5e7eb
--gray-100: #f3f4f6
--gray-50: #f9fafb

/* Status Colors */
--emerald-600: #059669 (완료/우수/낮음)
--emerald-50: #f0fdf4

--amber-600: #d97706 (진행중/양호/높음)
--amber-50: #fffbeb

--red-600: #dc2626 (실패/주의/매우높음)
--red-50: #fef2f2

--blue-600: #2563eb (진행중)
--blue-50: #eff6ff

--rose-600: #e11d48 (서스펜딩)
--rose-50: #fff5f7
```

---

## 6. 타이포그래피 (Typography)

```css
/* 페이지 제목 */
.page-title { @apply text-4xl font-black tracking-tight; }

/* 섹션 제목 */
.section-title { @apply text-xl font-black tracking-tight; }

/* 카드 라벨 */
.card-label { @apply text-[10px] font-black uppercase tracking-widest text-gray-400; }

/* 테이블 헤더 */
.table-header { @apply text-[11px] font-black uppercase tracking-widest text-gray-400; }

/* 큰 숫자 */
.stat-value { @apply text-4xl font-black tracking-tighter; }

/* 버튼 텍스트 */
.btn-text { @apply font-bold uppercase tracking-wide; }
```

---

## 7. 반응형 설계 (Responsive Design)

```css
/* Desktop (lg: 1024px+) */
- Grid: 4 columns (좌측 탭 2-3칸, 우측 사이드 1-2칸)
- Table: 전체 표시
- Chart: 나란히 표시

/* Tablet (md: 768px) */
- Grid: 2 columns
- Table: 스크롤 가능
- Chart: 스택 가능

/* Mobile (sm: 640px) */
- Grid: 1 column (탭 위에 사이드)
- Table: 카드 뷰
- Chart: 숨김

/* Very Small (xs: 320px) */
- 패딩/마진 축소
- 폰트 크기 조정
```

---

## 8. 상호작용 & 애니메이션 (Interactions)

### 8.1 호버 상태

```css
.card {
  @apply shadow-sm hover:shadow-xl transition-all duration-300;
}

.table-row {
  @apply group hover:bg-primary/[0.02] transition-all;
}

.link {
  @apply text-gray-500 hover:text-gray-900 hover:underline;
}
```

### 8.2 로딩 상태

```tsx
// 스피너
<svg className="w-8 h-8 text-primary animate-spin" />

// 스켈레톤 로더
<div className="space-y-3">
  {[...Array(5)].map((_, i) => (
    <div key={i} className="h-12 bg-gray-100 rounded-none animate-pulse" />
  ))}
</div>

// 진행률
<div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
  <div className="h-full bg-primary transition-all" style={{width: `${progress}%`}} />
</div>
```

### 8.3 토스트 알림

```tsx
// 성공
<div className="px-6 py-4 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold rounded-none shadow-sm animate-bounce">
  업로드 완료!
</div>

// 오류
<div className="px-6 py-4 bg-red-50 border border-red-100 text-red-700 font-bold rounded-none shadow-sm animate-bounce">
  업로드 실패
</div>
```

---

## 9. 폴더 구조 (Folder Structure)

```
src/
├─ app/
│  └─ admin/
│     ├─ callsign-mgmt-v1/
│     │  └─ page.tsx                      (메인 페이지)
│     └─ api/
│        └─ admin/
│           └─ statistics/
│              └─ route.ts                (통계 API)
│
├─ components/
│  ├─ callsign-mgmt-v1/
│  │  ├─ Tabs.tsx                        (탭 컨테이너)
│  │  ├─ OverviewTab.tsx                 (전체현황 탭)
│  │  ├─ ActionsTab.tsx                  (항공사조치 탭)
│  │  ├─ StatisticsTab.tsx               (통계 탭)
│  │  ├─ StatCard.tsx                    (KPI 카드)
│  │  └─ Sidebar.tsx                     (왼쪽 사이드)
│  │
│  └─ uploads/
│     ├─ FileUploadZone.tsx              (드래그 앤 드롭)
│     ├─ UploadResult.tsx                (결과 요약)
│     └─ UploadHistory.tsx               (이력)
│
├─ hooks/
│  └─ useActions.ts                      (기존 - 재사용)
│
└─ lib/
   ├─ constants.ts                       (ROUTES 업데이트)
   └─ api/
      └─ statistics.ts                   (통계 API 유틸)
```

---

## 10. 구현 순서 (Implementation Order)

### Phase 1: 기본 레이아웃 (Day 1)
1. [ ] 페이지 생성 (`/admin/callsign-mgmt-v1`)
2. [ ] 페이지 헤더 구현
3. [ ] 탭 컨테이너 구현
4. [ ] 왼쪽/오른쪽 그리드 구조

### Phase 2: 탭1 - 전체현황 (Day 1-2)
1. [ ] KPI 카드 (5개) 렌더링
2. [ ] 호출부호 테이블 + 필터
3. [ ] 페이지네이션
4. [ ] 데이터 연결 (useCallsigns hook)

### Phase 3: 탭2 - 항공사조치 (Day 2)
1. [ ] 항공사 현황 테이블
2. [ ] 조치율 프로그레스바 (색상 코딩)
3. [ ] Excel 내보내기 버튼
4. [ ] 데이터 연결

### Phase 4: 탭3 - 통계 (Day 2-3)
1. [ ] KPI 카드 (4개)
2. [ ] Recharts 차트 (또는 SVG)
3. [ ] 항공사별 상세 테이블
4. [ ] 데이터 연결

### Phase 5: 사이드바 (Day 3-4)
1. [ ] 파일 업로드 드래그 앤 드롭
2. [ ] 진행률 표시
3. [ ] 업로드 결과 카드
4. [ ] 업로드 이력 리스트

### Phase 6: 최적화 (Day 4)
1. [ ] 성능 최적화 (캐싱, 페이징)
2. [ ] 오류 처리
3. [ ] TypeScript 검증
4. [ ] 반응형 테스트

---

## 11. 의존성 (Dependencies)

```json
{
  "dependencies": {
    "react": "^18.x",
    "next": "^14.x",
    "zustand": "^4.x",
    "@tanstack/react-query": "^5.x",
    "recharts": "^2.x",          // 차트 라이브러리 (선택)
    "xlsx": "^0.18.x"             // Excel 생성 (기존)
  }
}
```

---

## 12. 검증 기준 (Acceptance Criteria)

### 기능 검증
- [x] 3개 탭 모두 데이터 표시
- [x] 필터/정렬 동작
- [x] 파일 업로드 완료
- [x] Excel 내보내기 작동
- [x] 페이지네이션 동작

### UI 검증
- [x] 기존 스타일 준수 (rounded-none, navy)
- [x] 반응형 레이아웃
- [x] 접근성 (ARIA 라벨)

### 성능 검증
- [x] 페이지 로드 < 2초
- [x] API 응답 < 500ms
- [x] TypeScript 에러 0개

---

## 13. 버전 이력 (Version History)

| 버전 | 날짜 | 변경 | 상태 |
|------|------|------|------|
| 1.0 | 2026-02-22 | 초안 - 기존 UI 스타일 적용 설계 | 완료 |

---

## 14. 부록: UI 컴포넌트 체크리스트 (Appendix)

### 재사용 컴포넌트
- [x] PremiumStatCard (기존 admin/page.tsx)
- [x] StatusBadge (기존)
- [x] Table (기존 admin/actions)
- [x] Modal (기존 ActionModal)

### 신규 컴포넌트
- [ ] FileUploadZone
- [ ] UploadResult
- [ ] UploadHistory
- [ ] StatisticsChart
- [ ] AirlineTable

---

**다음 단계**: `/pdca do callsign-management-v1` - Implementation phase
