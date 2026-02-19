# KATC1 인증 시스템 배포 가이드

## 📋 목차
1. [아키텍처 개요](#아키텍처-개요)
2. [로컬 개발 환경](#로컬-개발-환경)
3. [AWS 배포](#aws-배포)
4. [공공기관 서버 마이그레이션](#공공기관-서버-마이그레이션)
5. [운영 가이드](#운영-가이드)

---

## 아키텍처 개요

### 기술 스택
- **Frontend**: Next.js 14 (React)
- **Backend**: Next.js API Routes (별도 Express 서버 없음)
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **State Management**: Zustand (in-memory + cookie)
- **Form Validation**: react-hook-form + zod
- **Security**: JWT (accessToken 메모리 + refreshToken httpOnly 쿠키)

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    클라이언트 (Browser)                    │
│                                                           │
│  - React Components (UI)                                 │
│  - Zustand Store (accessToken 메모리)                    │
│  - react-hook-form (폼 관리)                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│              Next.js 14 Full-Stack Application           │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Frontend Pages (App Router)                      │   │
│  │ - /login, /signup, /dashboard, /admin          │   │
│  └─────────────────────────────────────────────────┘   │
│                     │                                    │
│                     ↓                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ API Routes (Backend)                            │   │
│  │ - /api/auth/* (signup, login, refresh)         │   │
│  │ - /api/admin/* (user management)               │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ TCP 5432
                     ↓
┌─────────────────────────────────────────────────────────┐
│            PostgreSQL 15 Database                        │
│                                                           │
│  - users table (with status, role, timestamps)          │
│  - audit_logs table (change tracking)                   │
│  - Indexes for performance                              │
└─────────────────────────────────────────────────────────┘
```

---

## 로컬 개발 환경

### 요구사항
- Docker & Docker Compose
- Node.js 20+
- npm or pnpm

### 빠른 시작

#### 1. Docker PostgreSQL 시작 (이미 실행 중)
```bash
docker ps | grep postgres
# 또는 새로 시작
docker run -d \
  -e POSTGRES_USER=katc1 \
  -e POSTGRES_PASSWORD=katc1_secure_password_2024 \
  -e POSTGRES_DB=katc1_auth \
  -p 5432:5432 \
  --name aviation-db \
  postgres:15-alpine
```

#### 2. 테이블 생성
```bash
PGPASSWORD=katc1_secure_password_2024 psql -h localhost -U katc1 -d katc1_auth -f scripts/init.sql
```

#### 3. 개발 서버 시작
```bash
npm run dev
# 또는
npm install && npm run dev
```

서버는 http://localhost:3001 에서 실행됩니다.

#### 4. 회원가입 테스트
1. http://localhost:3001/signup 방문
2. 이메일: `test@example.com`
3. 비밀번호: `Test1234` (8자 이상, 대문자, 숫자 필수)
4. 제출 버튼 클릭
5. 가입 성공 시 `/pending` 페이지로 이동 (30초 폴링)

#### 5. 관리자 승인 (선택사항)
1. 관리자 로그인: admin@katc.com / Admin1234
2. http://localhost:3001/admin/users 방문
3. 대기 중인 사용자 승인 클릭
4. 사용자 폴링이 자동으로 `/dashboard` 이동

---

## AWS 배포

### AWS 인프라 구성

#### 1단계: AWS 준비

##### RDS PostgreSQL 생성
```bash
# AWS Console 또는 CLI 사용
aws rds create-db-instance \
  --db-instance-identifier katc1-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.3 \
  --master-username katc1admin \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --publicly-accessible false \
  --db-subnet-group-name katc1-subnet-group
```

##### EC2 인스턴스 생성
```bash
# 권장: t3.small 이상
# OS: Ubuntu 22.04 LTS
# Security Group:
#   - HTTP (80)
#   - HTTPS (443)
#   - SSH (22) - 관리용
# Storage: 30GB EBS (gp3)
```

#### 2단계: EC2에 배포

##### SSH 접속
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

##### 필수 소프트웨어 설치
```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Node.js 설치 (npm 패키지 빌드 용)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx 설치 (리버스 프록시)
sudo apt-get install -y nginx
```

##### 애플리케이션 배포
```bash
# 코드 클론
cd /opt
git clone https://github.com/your-org/katc1.git
cd katc1

# 환경 변수 설정
cp .env.aws.example .env.production
# 아래 값들을 실제 AWS 값으로 변경:
# - DB_HOST: your-rds-endpoint.rds.amazonaws.com
# - DB_PASSWORD: 실제 암호
# - JWT_SECRET: 새로운 보안 키
nano .env.production

# Docker 이미지 빌드 및 실행
docker build -t katc1:latest .
docker run -d \
  --name katc1-app \
  --restart unless-stopped \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.production \
  katc1:latest
```

##### Nginx 설정 (리버스 프록시)
```bash
# /etc/nginx/sites-available/katc1 생성
sudo nano /etc/nginx/sites-available/katc1
```

```nginx
upstream katc1_app {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name katc1.company.com;

    # HTTPS 리다이렉트 (Let's Encrypt 사용)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name katc1.company.com;

    ssl_certificate /etc/letsencrypt/live/katc1.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/katc1.company.com/privkey.pem;

    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    client_max_body_size 10M;

    location / {
        proxy_pass http://katc1_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/katc1 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Let's Encrypt 인증서 설치
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d katc1.company.com
```

---

## 공공기관 서버 마이그레이션

### 마이그레이션 전략

#### Phase 1: 병렬 운영 (1-2개월)
```
AWS (기존)                          공공기관 서버 (신규)
    ├── 실제 트래픽 100%               ├── 데이터 복제
    ├── 자동 백업                      ├── 성능 테스트
    └── 모니터링                       └── 보안 검증
```

#### Phase 2: 트래픽 전환 (1-2주)
```
AWS: 90% → 공공기관: 10%
AWS: 50% → 공공기관: 50%
AWS: 10% → 공공기관: 90%
AWS: 0%  → 공공기관: 100% (롤백 준비)
```

#### Phase 3: AWS 종료
```
- 마지막 백업
- DNS 레코드 제거
- AWS 리소스 삭제
- 계약 종료
```

### 공공기관 서버 설치

#### 환경 조건
- OS: CentOS 7/8 또는 Ubuntu 20.04+
- CPU: 4 vCore 이상
- RAM: 8GB 이상
- Storage: 100GB 이상 (SSD)
- Network: 내부 네트워크 + DMZ 접근

#### 설치 프로세스

##### 1. 사전 요구사항
```bash
# Docker 설치 (CentOS)
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# 또는 (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

##### 2. 애플리케이션 배포
```bash
# 코드 배포
cd /opt
git clone <repository> katc1
cd katc1

# 정부 환경 설정
cp .env.government.example .env.local
nano .env.local

# 데이터베이스 초기화
docker-compose -f docker-compose.yml up -d postgres
sleep 10
docker-compose exec postgres psql -U katc1 -d katc1_auth -f /scripts/init.sql

# 애플리케이션 시작
docker-compose up -d app
```

##### 3. 보안 설정

```bash
# 방화벽 설정 (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# SELinux 설정 (선택사항)
# 공공기관 정책에 따라 조정 필요
sudo semanage port -a -t http_port_t -p tcp 3000

# SSL/TLS 인증서 (조직 CA 사용)
# /etc/docker/certs.d 에 인증서 배치
```

##### 4. 리버스 프록시 설정 (Apache 또는 Nginx)
```bash
# Apache 모듈 활성화
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite

# VirtualHost 설정
# /etc/httpd/conf.d/katc1.conf
<VirtualHost *:443>
    ServerName katc1.company.com

    SSLEngine on
    SSLCertificateFile /etc/pki/tls/certs/katc1.crt
    SSLCertificateKeyFile /etc/pki/tls/private/katc1.key
    SSLCertificateChainFile /etc/pki/tls/certs/chain.crt

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>
```

---

## 운영 가이드

### 백업 전략

#### 자동 백업 설정
```bash
# 일일 자동 백업 (cron)
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/backups/postgresql
mkdir -p $BACKUP_DIR

PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  -F c -b -v -f "$BACKUP_DIR/katc1_$DATE.backup"

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -type f -mtime +30 -delete
EOF

chmod +x /opt/backup-db.sh

# Crontab 설정
crontab -e
# 매일 2:00 AM 백업
0 2 * * * /opt/backup-db.sh
```

#### 복구 프로세스
```bash
# 백업 나열
pg_restore -l /backups/postgresql/katc1_20240219_020000.backup

# 복구 실행
PGPASSWORD=password pg_restore \
  -h localhost \
  -U katc1 \
  -d katc1_auth_restore \
  -v /backups/postgresql/katc1_20240219_020000.backup
```

### 모니터링

#### 로그 모니터링
```bash
# 실시간 로그 확인
docker-compose logs -f app

# 데이터베이스 로그
docker-compose logs -f postgres

# 저장된 로그 확인
docker logs --tail 100 katc1-app
```

#### 성능 모니터링
```bash
# 컨테이너 리소스 사용률
docker stats

# 데이터베이스 연결 상태
PGPASSWORD=password psql -h localhost -U katc1 -d katc1_auth -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"

# 느린 쿼리 분석
PGPASSWORD=password psql -h localhost -U katc1 -d katc1_auth << 'EOF'
SELECT mean_exec_time, calls, query FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;
EOF
```

### 업그레이드 프로세스

```bash
# 1. 현재 백업
/opt/backup-db.sh

# 2. 코드 업데이트
cd /opt/katc1
git pull origin main

# 3. 의존성 업데이트
npm install --production

# 4. 이미지 재빌드
docker-compose build --no-cache

# 5. 서비스 재시작
docker-compose up -d

# 6. 로그 확인
docker-compose logs app

# 롤백 필요 시:
git revert HEAD
docker-compose build --no-cache
docker-compose up -d
```

### 트러블슈팅

#### 데이터베이스 연결 실패
```bash
# 1. 컨테이너 상태 확인
docker ps | grep postgres

# 2. 포트 확인
netstat -tlnp | grep 5432

# 3. 환경 변수 확인
docker-compose config | grep DB_

# 4. 컨테이너 재시작
docker-compose restart postgres
docker-compose restart app
```

#### 높은 CPU/메모리 사용률
```bash
# 1. 느린 쿼리 식별
SELECT pid, query, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;

# 2. 인덱스 최적화
REINDEX DATABASE katc1_auth;

# 3. 메모리 누수 확인
docker-compose down
docker system prune -a
docker-compose up -d
```

#### 인증서 만료
```bash
# Let's Encrypt (AWS)
sudo certbot renew

# 공공기관 내부 CA
# 발급기관에 연장 요청
# 인증서 갱신 후 Docker 재시작
docker-compose restart app
```

---

## 마이그레이션 체크리스트

### Pre-Migration (1주일 전)
- [ ] 공공기관 서버 준비 완료
- [ ] 네트워크 연결 테스트
- [ ] 보안 감사 완료
- [ ] 백업 전략 확인
- [ ] 롤백 계획 수립

### Migration Day
- [ ] 최종 데이터 동기화
- [ ] 트래픽 전환 시작 (10%)
- [ ] 성능 모니터링 (1시간)
- [ ] 트래픽 점진적 증가
- [ ] 로그 지속적 확인

### Post-Migration
- [ ] 최종 검증 (24시간)
- [ ] AWS 환경 정리
- [ ] 문서화 업데이트
- [ ] 팀 교육 완료
- [ ] 정기 모니터링 시작

---

## 문의사항

문제 발생 시:
1. 로그 확인: `docker-compose logs -f`
2. 상태 확인: `docker ps`
3. 데이터베이스 연결: `PGPASSWORD=... psql -h ... -U katc1 -d katc1_auth`
4. 모니터링: `docker stats`
