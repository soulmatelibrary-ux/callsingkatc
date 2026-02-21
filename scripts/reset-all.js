#!/usr/bin/env node
/**
 * 모든 사용자 비밀번호 통일 및 항공사 재할당
 * 실행: node scripts/reset-all.js
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && key.trim() && !line.startsWith('#')) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

// 항공사 목록
const airlineCodes = [
  'KAL',  // 대한항공
  'AAR',  // 아시아나항공
  'JJA',  // 제주항공
  'JNA',  // 진에어
  'TWB',  // 티웨이항공
  'ABL',  // 에어부산
  'ASV',  // 에어서울
  'EOK',  // 이스타항공
  'FGW',  // 플라이강원
];

// PostgreSQL 연결 설정
const dbClient = new Client({
  host: env.DB_HOST || 'localhost',
  port: parseInt(env.DB_PORT || '5432'),
  user: env.DB_USER || 'postgres',
  password: env.DB_PASSWORD || 'postgres',
  database: env.DB_NAME || 'katc1_dev',
});

async function main() {
  console.log('🚀 사용자 비밀번호 및 항공사 재설정 시작...\n');

  try {
    // 데이터베이스 연결
    await dbClient.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    // 1. 새 비밀번호 해시 생성
    console.log('1️⃣  비밀번호 해시 생성 중...');
    const newPasswordHash = await bcrypt.hash('Starred3!', 10);
    console.log('✅ 비밀번호 해시 생성 완료\n');

    // 2. 항공사 정보 조회
    console.log('2️⃣  항공사 정보 조회...');
    const airlinesResult = await dbClient.query(
      `SELECT id, code, name_ko FROM airlines WHERE code = ANY($1::text[]) ORDER BY display_order`,
      [airlineCodes]
    );

    const airlineMap = {};
    airlinesResult.rows.forEach(airline => {
      airlineMap[airline.code] = airline.id;
    });

    console.log(`✅ ${airlinesResult.rows.length}개 항공사 정보 로드 완료\n`);

    // 3. 사용자 조회
    console.log('3️⃣  사용자 목록 조회...');
    const usersResult = await dbClient.query(
      `SELECT id, email, role FROM users ORDER BY created_at ASC`
    );

    console.log(`✅ ${usersResult.rows.length}명의 사용자 조회 완료\n`);

    // 4. 비밀번호 및 항공사 업데이트
    console.log('4️⃣  비밀번호 및 항공사 업데이트 시작...\n');

    let successCount = 0;

    for (let i = 0; i < usersResult.rows.length; i++) {
      const user = usersResult.rows[i];
      let airlineCode;

      if (user.email === 'starred1@naver.com') {
        airlineCode = 'KAL';
      } else if (user.role === 'admin') {
        console.log(`⏭️  ${user.email} (관리자) - 건너뛰기`);
        continue;
      } else {
        const airlineIndex = i % airlineCodes.length;
        airlineCode = airlineCodes[airlineIndex];
      }

      try {
        const airlineId = airlineMap[airlineCode];
        if (!airlineId) {
          console.error(`❌ ${user.email} - 항공사 ID 찾을 수 없음`);
          continue;
        }

        // 비밀번호와 항공사 함께 업데이트
        await dbClient.query(
          `UPDATE users SET password_hash = $1, airline_id = $2, updated_at = NOW() WHERE id = $3`,
          [newPasswordHash, airlineId, user.id]
        );

        console.log(`✅ ${user.email} → ${airlineCode} (비밀번호: Starred3!)`);
        successCount++;
      } catch (err) {
        console.error(`❌ ${user.email} 오류: ${err.message}`);
      }
    }

    console.log(`\n✨ 업데이트 완료:`);
    console.log(`   성공: ${successCount}명`);
    console.log(`\n🎉 모든 사용자 비밀번호를 'Starred3!'로 통일하고 항공사를 재할당했습니다!`);

    await dbClient.end();
  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
    process.exit(1);
  }
}

main();
