# 🐳 Docker 기반 PostgreSQL 설정 가이드

## 개요

`start.sh` 스크립트는 이제 다음 우선순위로 PostgreSQL을 실행합니다:
1. ✅ **Docker** (권장 - 설정 불필요)
2. ✅ **로컬 PostgreSQL** (폴백)

---

## Docker 설치

### macOS

```bash
# Homebrew 사용
brew install docker

# Docker Desktop 설치 (권장)
# https://www.docker.com/products/docker-desktop
```

### Ubuntu/Debian

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 사용자 권한 설정
sudo usermod -aG docker $USER
newgrp docker
```

### CentOS/RHEL

```bash
sudo dnf install docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

---

## Docker 사용 시작

### 1단계: Docker 실행 (macOS)

```bash
# Docker Desktop 앱 실행
open /Applications/Docker.app

# 또는 명령어로 실행
docker ps  # Docker가 실행 중인지 확인
```

### 2단계: 시스템 시작

```bash
cd /Users/sein/Desktop/katc1
./start.sh
```

✅ 완료! `start.sh`가 자동으로 Docker 컨테이너를 생성하고 PostgreSQL을 시작합니다.

---

## 🐳 Docker 컨테이너 관리

### 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 보기
docker ps

# 모든 컨테이너 보기 (중지된 것 포함)
docker ps -a

# KATC1 컨테이너만 보기
docker ps | grep katc1-postgres
```

### 컨테이너 로그 확인

```bash
# 실시간 로그
docker logs -f katc1-postgres

# 마지막 50줄
docker logs --tail 50 katc1-postgres

# 타임스탬프 포함
docker logs -f --timestamps katc1-postgres
```

### 수동 컨테이너 관리

```bash
# 컨테이너 시작
docker start katc1-postgres

# 컨테이너 중지
docker stop katc1-postgres

# 컨테이너 재시작
docker restart katc1-postgres

# 컨테이너 제거
docker rm katc1-postgres

# 컨테이너 제거 (실행 중인 경우)
docker rm -f katc1-postgres
```

---

## 📊 Docker 볼륨 관리

### 데이터 지속성

PostgreSQL 데이터는 Docker 볼륨에 저장됩니다:

```bash
# 볼륨 확인
docker volume ls | grep katc1

# 볼륨 상세 정보
docker volume inspect katc1-postgres-data

# 볼륨 제거 (데이터 삭제)
docker volume rm katc1-postgres-data
```

### 데이터 백업

```bash
# 데이터베이스 덤프
docker exec katc1-postgres pg_dump -U postgres katc1_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# 백업 확인
ls -lh backup_*.sql
```

### 데이터 복원

```bash
# 백업에서 복원
docker exec -i katc1-postgres psql -U postgres katc1_dev < backup_20260219_120000.sql
```

---

## 🔧 PostgreSQL 접속

### Docker를 통한 접속

```bash
# 대화형 SQL 쉘 (psql)
docker exec -it katc1-postgres psql -U postgres -d katc1_dev

# SQL 명령어 직접 실행
docker exec katc1-postgres psql -U postgres -d katc1_dev -c "SELECT * FROM users;"

# 파일에서 SQL 스크립트 실행
docker exec -i katc1-postgres psql -U postgres -d katc1_dev < script.sql
```

### 호스트에서 접속 (pgAdmin, DataGrip 등)

```
호스트: localhost
포트: 5432
사용자명: postgres
비밀번호: postgres
데이터베이스: katc1_dev
```

---

## 🚀 Docker 최적화 팁

### 메모리 설정

Docker Desktop 설정에서:
- Preferences > Resources > Memory: 2GB 이상 권장
- CPU: 2 이상 권장

### 자동 정리

```bash
# 미사용 이미지 정리
docker image prune -a

# 미사용 볼륨 정리
docker volume prune

# 정지된 컨테이너 정리
docker container prune

# 전체 정리 (주의!)
docker system prune -a
```

---

## 🔐 보안 설정

### 기본 자격증명 (개발용)

```
사용자명: postgres
비밀번호: postgres
```

### 프로덕션 환경

`start.sh`에서 환경 변수 수정:

```bash
# start.sh의 docker run 명령어 수정
-e POSTGRES_PASSWORD=$(openssl rand -base64 16) \
```

---

## 🐛 문제 해결

### 컨테이너 시작 실패

```bash
# 로그 확인
docker logs katc1-postgres

# 포트 충돌 확인
lsof -i :5432

# 기존 컨테이너 제거 후 재시작
docker rm -f katc1-postgres
./start.sh
```

### 데이터베이스 연결 실패

```bash
# 컨테이너 상태 확인
docker ps | grep katc1-postgres

# 포트 포워딩 확인
docker port katc1-postgres

# 네트워크 진단
docker network inspect bridge
```

### 메모리 부족

```bash
# Docker 메모리 사용량 확인
docker stats katc1-postgres

# 메모리 제한 설정
docker update --memory 2g katc1-postgres
```

---

## 📈 모니터링

### Docker Desktop UI

Docker Desktop 앱에서 Containers 탭에서 시각적으로 모니터링 가능

### 명령어 모니터링

```bash
# 실시간 리소스 사용량
docker stats katc1-postgres

# 컨테이너 이벤트
docker events --filter 'container=katc1-postgres'

# 상세 정보
docker inspect katc1-postgres
```

---

## 🔄 Docker 이미지 관리

### 이미지 확인

```bash
# PostgreSQL 이미지 확인
docker images | grep postgres

# 구체적 정보
docker image inspect postgres:15
```

### 이미지 업데이트

```bash
# 최신 이미지 다운로드
docker pull postgres:15

# 컨테이너 재생성
docker rm -f katc1-postgres
./start.sh
```

---

## 📚 유용한 명령어

```bash
# Docker 상태 확인
docker ps

# 컨테이너 IP 확인
docker inspect -f '{{.NetworkSettings.IPAddress}}' katc1-postgres

# 컨테이너 내부 파일 복사
docker cp katc1-postgres:/path/to/file ./local/path

# 컨테이너에 파일 복사
docker cp ./local/file katc1-postgres:/path/to/file

# 컨테이너에서 명령 실행
docker exec katc1-postgres ls -la /var/lib/postgresql/data
```

---

## 🎯 일반적인 워크플로우

### 개발 시작

```bash
# 1. Docker 실행
open /Applications/Docker.app  # macOS

# 2. 시스템 시작
./start.sh

# 3. 개발
# ... 코드 작업 ...

# 4. 시스템 중지
./stop.sh
```

### 데이터 초기화

```bash
# 전체 초기화
./stop.sh
docker volume rm katc1-postgres-data
./start.sh
```

### 문제 해결

```bash
# 전체 재시작
./stop.sh
docker rm -f katc1-postgres
docker volume rm katc1-postgres-data
./start.sh
```

---

## 💡 Docker vs 로컬 PostgreSQL

| 항목 | Docker | 로컬 |
|------|--------|------|
| 설정 난이도 | 낮음 (자동) | 중간 |
| 성능 | 우수 | 최고 |
| 격리 | 우수 | 없음 |
| 정리 | 간단 | 복잡 |
| 권장 | ✅ 권장 | 폴백용 |

---

**마지막 업데이트:** 2026-02-19

**참고:** `start.sh`와 `stop.sh`가 Docker를 자동으로 감지하고 관리합니다.
