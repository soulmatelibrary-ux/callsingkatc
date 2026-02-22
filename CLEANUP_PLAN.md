# 📋 프로젝트 정리 계획

**목표**: 꼭 필요한 파일과 내용만 유지하고 나머지 삭제

---

## 🗑️ 삭제 가능한 파일 목록

### 1. 테스트 스크립트 (5.9K + 1.2K)
```
- performance-test.sh (5.9K)
- run-performance-test.sh (1.2K)
```
**용도**: 성능 테스트 (docs/05-testing/에 가이드 있음)
**삭제 여부**: ❓ 테스트 자동화에 사용되면 유지, 일회용이면 삭제

---

### 2. 목업/샘플 폴더 (개발 중간 산물)
```
src/app/admin/mockup/
src/app/admin/airlines/mockup/
```
**용도**: UI 개발 시 목업
**삭제 여부**: ✅ 삭제 권장 (완성된 페이지만 필요)

---

### 3. 레거시 v1 폴더 (지원 종료)
```
src/app/admin/callsign-mgmt-v1/
src/app/(auth)/login-mockup/  (이미 커밋 스트림에서 제거됨)
```
**용도**: 구버전 페이지
**삭제 여부**: ✅ 삭제 권장 (새 버전으로 이동 완료)

---

### 4. 기타 샘플 파일
```
airline.html (항공사 색상 참고용)
callsign.xlsx (샘플 데이터)
```
**용도**: 참고/테스트용
**삭제 여부**: ❓ 개발 중 참고하면 유지, 아니면 삭제

---

## ✅ 유지할 파일

### 핵심 소스코드
```
src/app/
  ├── (auth)/              # 인증 페이지
  ├── (main)/              # 사용자 페이지
  ├── admin/               # 관리자 페이지
  ├── api/                 # API 라우트
  ├── announcements/       # 공지사항
  ├── callsign-management/ # 유사호출부호 관리
  ├── dashboard/           # 대시보드
  ├── layout.tsx           # 레이아웃
  └── page.tsx             # 홈페이지

src/components/
src/hooks/
src/lib/
src/types/
src/middleware.ts
```

### 설정 파일
```
✅ next.config.js
✅ tailwind.config.ts
✅ postcss.config.js
✅ tsconfig.json
✅ package.json
✅ package-lock.json
✅ docker-compose.yml
```

### 문서
```
✅ README.md (루트)
✅ docs/ (모든 하위 문서)
```

---

## 📊 정리 전/후 비교

### 정리 전
```
루트: 30개 파일 (MD, script, config 등)
src: 개발 중간 산물 포함
total: 약 150MB (node_modules 제외)
```

### 정리 후
```
루트: 필수 파일만 (~15개)
src: 핵심 코드만
total: 약 100MB (node_modules 제외)
```

---

## 🚀 정리 실행 계획

### Phase 1: 낮은 위험도 삭제 (즉시)
- [ ] 목업 폴더 삭제 (src/app/*/mockup/)
- [ ] 레거시 v1 폴더 삭제 (callsign-mgmt-v1/)
- [ ] 테스트 스크립트 정리 (또는 유지)

### Phase 2: 확인 후 삭제
- [ ] airline.html 용도 확인
- [ ] callsign.xlsx 용도 확인

---

## 💾 Git 정리

정리 후 커밋:
```bash
git add -A
git commit -m "chore: 프로젝트 정리 - 불필요한 파일 삭제, 문서 통합"
```

---

**최종 결정**: 위 파일들을 삭제해도 괜찮을까요?
- ✅ YES: 즉시 실행
- ❓ HOLD: 특정 파일만 확인 후 진행
