# Excel 업로드 데이터 정규화 - SQL 검증 가이드

## 📋 스키마 검증

### 1. callsign_occurrences 테이블 확인
```sql
-- 테이블 존재 여부 확인
SELECT table_name FROM information_schema.tables
WHERE table_name = 'callsign_occurrences';
```

### 2. 테이블 구조 확인
```sql
\d callsign_occurrences;

-- 또는 상세 조회
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'callsign_occurrences'
ORDER BY ordinal_position;
```

### 3. 제약조건 확인
```sql
-- UNIQUE 제약조건 확인
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'callsign_occurrences';

-- 인덱스 확인
SELECT indexname FROM pg_indexes
WHERE tablename = 'callsign_occurrences';
```

---

## 🧪 데이터 검증

### 1. 호출부호 정규화 검증
```sql
-- callsigns 테이블: 중복된 호출부호 쌍이 없는지 확인
SELECT airline_code, callsign_pair, COUNT(*) as cnt
FROM callsigns
GROUP BY airline_code, callsign_pair
HAVING COUNT(*) > 1;
-- 결과: 0개 행 (중복 없음)
```

### 2. 발생 이력 집계 검증
```sql
-- 호출부호별 발생 건수 및 마지막 발생일
SELECT
  c.id,
  c.airline_code,
  c.callsign_pair,
  COUNT(co.id) as occurrence_count,
  MAX(co.occurred_date) as last_occurred_at
FROM callsigns c
LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
GROUP BY c.id, c.airline_code, c.callsign_pair
ORDER BY occurrence_count DESC;
```

### 3. 항공사별 호출부호 조회 (API 쿼리 테스트)
```sql
-- 특정 항공사의 조치가 안 된 호출부호만 조회
SELECT
  c.id, c.airline_code, c.callsign_pair, c.risk_level, c.similarity,
  COUNT(co.id) AS occurrence_count,
  MAX(co.occurred_date) AS last_occurred_at
FROM callsigns c
LEFT JOIN actions a ON c.id = a.callsign_id
LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
WHERE c.airline_id = 'KAL의-UUID' AND a.id IS NULL
GROUP BY c.id, c.airline_code, c.callsign_pair, c.risk_level, c.similarity
ORDER BY occurrence_count DESC
LIMIT 50;
```

### 4. 발생 날짜 범위 검증
```sql
-- 호출부호별 발생 날짜 범위 조회
SELECT
  c.callsign_pair,
  MIN(co.occurred_date) as first_occurred,
  MAX(co.occurred_date) as last_occurred,
  COUNT(co.id) as total_occurrences
FROM callsigns c
LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
GROUP BY c.callsign_pair
ORDER BY first_occurred;
```

---

## 📊 샘플 데이터 삽입 (테스트용)

### 1. 호출부호 쌍 추가
```sql
-- 국내 항공사별로 호출부호 추가 (callsigns 테이블)
INSERT INTO callsigns
  (airline_id, airline_code, callsign_pair, my_callsign, other_callsign,
   other_airline_code, risk_level, similarity)
SELECT
  airlines.id, 'KAL',
  'KAL111 | AAR111', 'KAL111', 'AAR111', 'AAR',
  '매우높음', '높음'
FROM airlines WHERE code = 'KAL'
ON CONFLICT (airline_code, callsign_pair) DO NOTHING
RETURNING id;
```

### 2. 발생 이력 추가
```sql
-- 위에서 반환된 callsign_id를 사용
INSERT INTO callsign_occurrences
  (callsign_id, occurred_date, error_type, sub_error)
VALUES
  ('callsign_id_here', '2026-01-01', '관제사 오류', '복창오류'),
  ('callsign_id_here', '2026-01-02', '관제사 오류', '복창오류'),
  ('callsign_id_here', '2026-01-03', '관제사 오류', '복창오류')
ON CONFLICT (callsign_id, occurred_date) DO NOTHING;
```

### 3. 결과 확인
```sql
-- 위에서 생성한 호출부호의 발생 건수 조회
SELECT
  c.callsign_pair,
  COUNT(co.id) as occurrence_count,
  MAX(co.occurred_date) as last_occurred_at
FROM callsigns c
LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
WHERE c.callsign_pair = 'KAL111 | AAR111'
GROUP BY c.callsign_pair;

-- 결과:
-- callsign_pair    | occurrence_count | last_occurred_at
-- KAL111 | AAR111  | 3                | 2026-01-03
```

---

## ⚠️ 일반적인 문제 및 해결

### 1. UNIQUE 제약조건 위반
```
ERROR: duplicate key value violates unique constraint
"callsign_occurrences_callsign_id_occurred_date_key"
```
**해결**: 같은 호출부호가 같은 날짜에 업로드되었습니다.
- Excel 파일에서 중복 행 제거
- 또는 API가 자동으로 무시하도록 설정되어 있음 (ON CONFLICT DO NOTHING)

### 2. 발생 건수가 NULL 반환
```sql
-- 집계 결과 확인 (NULL이 나오는 경우)
SELECT
  c.id,
  COUNT(co.id),  -- 0이 반환됨 (NULL 아님)
  MAX(co.occurred_date)  -- NULL이 반환될 수 있음 (데이터 없을 때)
FROM callsigns c
LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
GROUP BY c.id;
```
**해결**: COALESCE로 기본값 설정
```sql
COALESCE(COUNT(co.id), 0) as occurrence_count,
COALESCE(MAX(co.occurred_date), c.created_at) as last_occurred_at
```

### 3. GROUP BY 쿼리가 느림
**해결**: 인덱스 확인 및 추가
```sql
CREATE INDEX idx_callsign_occurrences_callsign_id
ON callsign_occurrences(callsign_id);

CREATE INDEX idx_callsign_occurrences_occurred_date
ON callsign_occurrences(occurred_date DESC);
```

---

## 📈 성능 확인

### 1. 쿼리 성능 테스트
```sql
-- EXPLAIN으로 쿼리 계획 확인
EXPLAIN ANALYZE
SELECT
  c.id, c.callsign_pair,
  COUNT(co.id) AS occurrence_count,
  MAX(co.occurred_date) AS last_occurred_at
FROM callsigns c
LEFT JOIN callsign_occurrences co ON c.id = co.callsign_id
GROUP BY c.id, c.callsign_pair
LIMIT 50;
```

### 2. 테이블 크기 확인
```sql
-- callsigns와 callsign_occurrences의 행 수 비교
SELECT
  'callsigns' as table_name,
  COUNT(*) as row_count
FROM callsigns
UNION ALL
SELECT
  'callsign_occurrences' as table_name,
  COUNT(*) as row_count
FROM callsign_occurrences;

-- 예상 결과:
-- callsigns의 행 수 < callsign_occurrences의 행 수
-- (정규화되었으므로 callsigns는 더 작음)
```

---

## ✅ 최종 검증 체크리스트

- [ ] `callsign_occurrences` 테이블 생성됨
- [ ] UNIQUE(callsign_id, occurred_date) 제약조건 있음
- [ ] 외래키 참조 정상 작동
- [ ] 호출부호 쌍 중복 없음 (1개씩만 저장)
- [ ] 발생 이력이 날짜별로 저장됨
- [ ] 집계 쿼리가 올바른 COUNT 반환
- [ ] 집계 쿼리가 올바른 MAX(occurred_date) 반환
- [ ] API 응답에 occurrence_count 포함
- [ ] API 응답에 last_occurred_at 포함
- [ ] 대시보드에서 발생 건수 표시됨
- [ ] 대시보드에서 마지막 발생일 표시됨
- [ ] Excel 내보내기에 두 필드 포함됨

---

**작성자**: Claude
**최종 수정**: 2026-02-20
