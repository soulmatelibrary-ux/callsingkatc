# 📚 KATC1 프로젝트 문서 통합 인덱스

> 항공교통관제(ATC) 시스템 - 유사호출부호 경고시스템
> **프로젝트 상태**: Phase 6 진행 중 | **마지막 업데이트**: 2026-02-22

---

## 🎯 빠른 시작 (Quick Links)

| 문서 | 목적 | 대상 |
|------|------|------|
| [README.md](../README.md) | 프로젝트 개요 | 모든 사용자 |
| [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md) | 개발 로드맵 | 개발팀 |
| [PROJECT_STATUS.md](../PROJECT_STATUS.md) | 현재 진행 상황 | 관리자 |

---

## 📖 문서 구조

### 🔧 **00-setup/** - 설정 & 배포
프로젝트 환경 설정, 배포, DB 초기화

| 문서 | 목적 |
|------|------|
| [DOCKER_SETUP.md](00-setup/DOCKER_SETUP.md) | Docker 환경 구성 |
| [DEPLOYMENT_GUIDE.md](00-setup/DEPLOYMENT_GUIDE.md) | 배포 가이드 |
| [SETUP_GUIDE.md](00-setup/SETUP_GUIDE.md) | 초기 설정 가이드 |
| [SETUP_SUMMARY.md](00-setup/SETUP_SUMMARY.md) | 설정 요약 |
| [VERIFICATION_SQL.md](00-setup/VERIFICATION_SQL.md) | SQL 검증 스크립트 |

### 📋 **01-plan/** - 개발 계획
기능별 계획서 (PDCA Plan Phase)

| 문서 | 상태 | 목적 |
|------|------|------|
| [katc1-authentication.plan.md](01-plan/features/katc1-authentication.plan.md) | ✅ 완료 | 인증 시스템 계획 |
| [callsign-management-v1.plan.md](01-plan/features/callsign-management-v1.plan.md) | ✅ 완료 | 유사호출부호 관리 계획 |
| [airline-data-action-management.plan.md](01-plan/features/airline-data-action-management.plan.md) | ✅ 완료 | 항공사 조치 관리 계획 |
| [callsigns-actions-management.plan.md](01-plan/features/callsigns-actions-management.plan.md) | ✅ 완료 | 호출부호 조치 관리 계획 |
| [implementation-priority.md](01-plan/features/implementation-priority.md) | ✅ 완료 | 구현 우선순위 |

### 🎨 **02-design/** - 설계 문서
기능별 설계 (PDCA Design Phase)

| 문서 | 상태 | 목적 |
|------|------|------|
| [ARCHITECTURE_DESIGN.md](02-design/ARCHITECTURE_DESIGN.md) | ✅ 완료 | 전체 아키텍처 |
| [LOGIN_SYSTEM_DESIGN.md](02-design/LOGIN_SYSTEM_DESIGN.md) | ✅ 완료 | 로그인 시스템 설계 |
| [SCREEN_STRUCTURE_DESIGN.md](02-design/SCREEN_STRUCTURE_DESIGN.md) | ✅ 완료 | 화면 구조 설계 |
| [AIRLINES_DATA.md](02-design/AIRLINES_DATA.md) | ✅ 완료 | 항공사 데이터 설계 |
| [security-spec.md](02-design/security-spec.md) | ✅ 완료 | 보안 명세 |
| [_INDEX.md](02-design/_INDEX.md) | ✅ 완료 | 설계 인덱스 |
| **features/** | 기능별 설계 | |
| └ [callsign-management-v1.design.md](02-design/features/callsign-management-v1.design.md) | ✅ 완료 | 유사호출부호 관리 설계 |
| └ [airline-data-action-management.design.md](02-design/features/airline-data-action-management.design.md) | ✅ 완료 | 항공사 조치 관리 설계 |

### 🔍 **03-analysis/** - 갭 분석 & 검증
설계-구현 비교 분석 (PDCA Check Phase)

| 문서 | 상태 | 일치도 |
|------|------|--------|
| [katc1-auth-gap.md](03-analysis/features/katc1-auth-gap.md) | ✅ 완료 | 95% |
| [katc1-full-gap-v5.md](03-analysis/features/katc1-full-gap-v5.md) | ✅ 완료 | 90% |
| [callsign-management-v1.analysis.md](03-analysis/features/callsign-management-v1.analysis.md) | ✅ 완료 | 75% |
| [airline-data-action-management.analysis.md](03-analysis/features/airline-data-action-management.analysis.md) | ✅ 완료 | - |
| [zero-script-qa-monitoring.md](03-analysis/zero-script-qa-monitoring.md) | ✅ 완료 | - |

### 📊 **04-report/** - 완료 보고서
기능 완료 보고서 (PDCA Report Phase)

| 문서 | 상태 | 대상 |
|------|------|------|
| [_INDEX.md](04-report/_INDEX.md) | ✅ 완료 | 보고서 목록 |
| [changelog.md](04-report/changelog.md) | ✅ 완료 | 변경 로그 |
| [zero-script-qa-performance-2026-02-22.md](04-report/zero-script-qa-performance-2026-02-22.md) | ✅ 완료 | 성능 테스트 보고서 |
| **features/** | 기능별 보고서 | |
| └ [katc1-auth-v1.md](04-report/features/katc1-auth-v1.md) | ✅ 완료 | 인증 시스템 완료 보고서 |
| └ [katc1-auth-report.md](04-report/features/katc1-auth-report.md) | ✅ 완료 | 인증 완료 보고서 |
| └ [IMPLEMENTATION_SUMMARY.md](04-report/IMPLEMENTATION_SUMMARY.md) | ✅ 완료 | 구현 요약 |
| └ [COMPLETION_SUMMARY.md](04-report/COMPLETION_SUMMARY.md) | ✅ 완료 | 완료 요약 |
| └ [DESIGN_COMPLETE_SUMMARY.md](04-report/DESIGN_COMPLETE_SUMMARY.md) | ✅ 완료 | 설계 완료 요약 |
| └ [SIDEBAR_IMPLEMENTATION_SUMMARY.md](04-report/SIDEBAR_IMPLEMENTATION_SUMMARY.md) | ✅ 완료 | 사이드바 구현 요약 |

### 🧪 **05-testing/** - 테스트 & QA
테스트 가이드 및 결과

| 문서 | 목적 |
|------|------|
| [TESTING_GUIDE.md](05-testing/TESTING_GUIDE.md) | 테스트 가이드 |
| [QA_CHECKLIST.md](05-testing/QA_CHECKLIST.md) | QA 체크리스트 |
| [ZERO_SCRIPT_QA_SUMMARY.md](05-testing/ZERO_SCRIPT_QA_SUMMARY.md) | Zero Script QA 요약 |
| [zero-script-qa-performance.md](05-testing/zero-script-qa-performance.md) | 성능 테스트 상세 |
| [QA_COMPLETION_REPORT.md](05-testing/QA_COMPLETION_REPORT.md) | QA 완료 보고서 |

### 📝 **06-changelog/** - 변경 이력 & 아카이브
프로젝트 변경 사항 기록

| 문서 | 목적 |
|------|------|
| [CHANGES_SUMMARY.md](06-changelog/CHANGES_SUMMARY.md) | 변경 요약 |
| [CLEANUP_SUMMARY.md](06-changelog/CLEANUP_SUMMARY.md) | 정리 요약 |
| [REPORT_GENERATION_LOG.md](06-changelog/REPORT_GENERATION_LOG.md) | 보고서 생성 로그 |

### 🗄️ **archive/** - 완료된 기능 아카이브
완료된 PDCA 사이클 (자동 정리)

| 기능 | 완료 기간 | 상태 |
|------|----------|------|
| [announcement-system/](archive/2026-02/announcement-system/) | 2026-02 | ✅ 아카이브 |
| [_INDEX.md](archive/2026-02/_INDEX.md) | - | 📋 목록 |

---

## 🚀 현재 진행 상황

### Phase별 상태
```
[✅ Plan]  →  [✅ Design]  →  [✅ Do]  →  [✅ Check]  →  [🔄 Act]  →  [📋 Report]
```

### 최근 작업 (2026-02-22)
- ✅ **Gap Analysis**: 75% 일치도 (callsign-management)
- ✅ **Security Review**: 68/100 점수 (OWASP Top 10)
- ✅ **Performance Testing**: Grade A+ (Zero Script QA)

### 다음 할 일
- 🔴 **CRITICAL 보안 이슈 2개 수정**
  - 환경변수 credentials 노출
  - Debug APIs 인증 없이 접근
- 🟠 **HIGH 보안 이슈 6개 해결**
- 🟡 **MEDIUM 보안 이슈 6개 개선**
- 📝 **Phase 6 구현**: 조치 이력 탭 UI, Excel 내보내기

---

## 📞 참고 사항

### 문서 위치 규칙
```
프로젝트 루트/
├── README.md                          # 프로젝트 메인 문서
├── DEVELOPMENT_PLAN.md               # 개발 로드맵
├── PROJECT_STATUS.md                 # 현재 상태
└── docs/
    ├── 00-setup/                     # 🔧 설정 & 배포
    ├── 01-plan/                      # 📋 개발 계획 (PDCA Plan)
    ├── 02-design/                    # 🎨 설계 (PDCA Design)
    ├── 03-analysis/                  # 🔍 갭 분석 (PDCA Check)
    ├── 04-report/                    # 📊 완료 보고서 (PDCA Report)
    ├── 05-testing/                   # 🧪 테스트 & QA
    ├── 06-changelog/                 # 📝 변경 이력
    ├── README.md                     # 📚 이 문서 (통합 인덱스)
    └── archive/                      # 🗄️ 완료된 기능 아카이브
```

### PDCA 문서 이름 규칙
- **Plan**: `{feature}.plan.md`
- **Design**: `{feature}.design.md`
- **Analysis**: `{feature}.analysis.md`
- **Report**: `{feature}.report.md`

---

## 📌 문서 유지보수

### 새 문서 추가 시
1. 적절한 폴더에 배치 (00~06 중 선택)
2. 파일명 규칙 준수 (기능별 또는 주제별)
3. 이 README.md 업데이트

### 오래된 문서 정리
- 완료된 기능 → `archive/` 이동
- 불필요한 문서 → 삭제 후 commit

---

**마지막 수정**: 2026-02-22 | **관리**: PDCA Unified Skill | **버전**: 1.0
