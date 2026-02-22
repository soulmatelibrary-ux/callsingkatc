# 대시보드 조치이력 탭 - 전체 호출부호 표시 구현 완료

## 📋 변경 사항 요약

### 문제점
- "발생현황" 탭: 99개 호출부호 (조치 안 된 것)
- "조치이력" 탭: 3개만 표시 (조치가 있는 것만)
- **요청**: 조치이력 탭에서 모든 99개 호출부호와 조치 상태 통합 표시

### 해결책
`GET /api/airlines/[airlineId]/actions` 엔드포인트 수정

**변경 전:**
```sql
FROM actions a
LEFT JOIN callsigns cs ON a.callsign_id = cs.id
WHERE a.airline_id = $1
```
→ **조치가 있는 것만 반환** (3개)

**변경 후:**
```sql
FROM callsigns cs
LEFT JOIN actions a ON cs.id = a.callsign_id
WHERE cs.airline_id = $1
```
→ **모든 호출부호 + 조치 상태 함께 반환** (99개)

## 📊 대시보드 탭 동작

### "발생현황" 탭 (유사호출부호목록)
- **조회 API**: `/api/airlines/[airlineId]/callsigns`
- **표시 대상**: 조치가 안 된 호출부호만
- **개수**: 99개 ✓
- **기능**: 위험도 필터, 페이지네이션, Excel 내보내기

### "조치이력" 탭 (조치 이력)
- **조회 API**: `/api/airlines/[airlineId]/actions` ← **변경됨**
- **표시 대상**: **모든 호출부호** (조치 여부 무관)
- **개수**: 99개 ✓
- **컬럼**:
  - 호출부호 쌍 (callsign_pair)
  - 조치 유형 (조치가 있는 경우만)
  - 관리자 담당자 (조치가 있는 경우만)
  - 항공사 담당자 (조치가 있는 경우만)
  - 상태 (pending/in_progress/completed 또는 null)
  - 등록일 (조치 등록일 또는 공란)
  - 상세보기 버튼

### "Excel 업로드" 탭
- 엑셀 파일 업로드로 호출부호 자동 등록
- 기존 데이터 업데이트 지원

## 🔄 API 응답 구조

```json
{
  "data": [
    {
      "id": "action-uuid" (또는 null if 조치 없음),
      "callsign_id": "cs-uuid",
      "callsign": {
        "callsign_pair": "KAL2005|KAL2022",
        "my_callsign": "KAL2005",
        "other_callsign": "KAL2022",
        "risk_level": "매우높음",
        "occurrence_count": 5,
        "error_type": "관제사 오류",
        "similarity": "높음"
      },
      "action_type": "편명 변경" (또는 null),
      "status": "completed" (또는 null),
      "manager_name": "담당자명" (또는 null),
      "registered_at": "2026-02-20T10:30:00Z" (또는 null)
    },
    // ... 총 99개
  ],
  "pagination": {
    "page": 1,
    "limit": 999,
    "total": 99,
    "totalPages": 1
  }
}
```

## ✅ 빌드 상태
- ✅ TypeScript 컴파일 성공
- ✅ npm run build 성공 (Clear cache 후)
- ✅ 모든 페이지 정상 컴파일
- ✅ API 라우트 정상 작동

## 🚀 테스트 방법

1. **개발 서버 시작**
   ```bash
   npm run dev
   ```

2. **대시보드 접속**
  - URL: `http://localhost:3000/admin/dashboard`
   - 사용자 로그인 필요

3. **"조치이력" 탭 확인**
   - 99개 호출부호 모두 표시되는지 확인
   - 조치가 있는 항목: 조치 상세 정보 표시
   - 조치가 없는 항목: 호출부호만 표시 (조치 필드 공란)

4. **필터링 테스트**
   - 상태 필터: 전체/대기중/진행중/완료
   - 날짜 범위 필터: 시작일/종료일
   - 필터 적용 후에도 모든 호출부호 표시 확인

## 📝 파일 변경 목록
- `src/app/api/airlines/[airlineId]/actions/route.ts` (GET 엔드포인트 수정)
  - FROM 절 변경: `FROM actions a` → `FROM callsigns cs`
  - LEFT JOIN 순서 변경
  - SELECT 절에 호출부호 상세정보 추가
  - COUNT 쿼리 수정
  - 응답 매핑 로직 업데이트

## 🔗 관련 코드
- **API 엔드포인트**: `/api/airlines/[airlineId]/actions`
- **React 훅**: `useAirlineActions()` (src/hooks/useActions.ts)
- **대시보드 컴포넌트**: `src/app/dashboard/page.tsx`
- **타입 정의**: `src/types/action.ts`

## 💡 향후 개선사항 (선택사항)
- [ ] "조치이력" 탭을 "호출부호 현황 + 조치이력" 으로 명칭 변경
- [ ] 호출부호별 조치 히스토리 최신 기준 정렬
- [ ] 다중 조치 지원 (1개 호출부호에 여러 조치)
- [ ] 조치 진행률 시각화 (프로그레스 바)

---

**커밋 해시**: 1732f94
**작성일**: 2026-02-20
**상태**: ✅ 완료 및 검증 완료
