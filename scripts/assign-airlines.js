#!/usr/bin/env node
/**
 * 사용자에게 항공사를 할당하는 스크립트
 * 실행: node scripts/assign-airlines.js
 */

const { Client } = require('pg');
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
  console.log('🚀 사용자 항공사 할당 시작...\n');

  try {
    // 데이터베이스 연결
    await dbClient.connect();
    console.log('✅ 데이터베이스 연결 완료\n');

    // 1. 항공사 정보 조회
    console.log('1️⃣  항공사 정보 조회...');
    const airlinesResult = await dbClient.query(
      `SELECT id, code, name_ko FROM airlines WHERE code = ANY($1::text[]) ORDER BY display_order`,
      [airlineCodes]
    );

    if (airlinesResult.rows.length === 0) {
      console.error('❌ 항공사 정보를 찾을 수 없습니다.');
      process.exit(1);
    }

    // airline code -> id 매핑
    const airlineMap = {};
    airlinesResult.rows.forEach(airline => {
      airlineMap[airline.code] = airline.id;
    });

    console.log(`✅ ${airlinesResult.rows.length}개 항공사 정보 로드 완료\n`);

    // 2. 사용자 조회
    console.log('2️⃣  사용자 목록 조회...');
    const usersResult = await dbClient.query(
      `SELECT id, email, role FROM users ORDER BY created_at ASC`
    );

    if (usersResult.rows.length === 0) {
      console.error('❌ 사용자를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ ${usersResult.rows.length}명의 사용자 조회 완료\n`);

    // 3. 항공사 할당
    console.log('3️⃣  항공사 할당 시작...\n');

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < usersResult.rows.length; i++) {
      const user = usersResult.rows[i];
      let airlineCode;

      if (user.email === 'starred1@naver.com') {
        // starred1 사용자는 대한항공 (KAL)
        airlineCode = 'KAL';
      } else if (user.role === 'admin') {
        // 관리자는 건너뛰기
        console.log(`⏭️  ${user.email} (관리자) - 건너뛰기`);
        skipCount++;
        continue;
      } else {
        // 나머지는 순서대로 할당
        const airlineIndex = i % airlineCodes.length;
        airlineCode = airlineCodes[airlineIndex];
      }

      try {
        const airlineId = airlineMap[airlineCode];
        if (!airlineId) {
          console.error(`❌ ${user.email} → ${airlineCode} (항공사 ID 찾을 수 없음)`);
          continue;
        }

        await dbClient.query(
          `UPDATE users SET airline_id = $1, updated_at = NOW() WHERE id = $2`,
          [airlineId, user.id]
        );

        console.log(`✅ ${user.email} → ${airlineCode}`);
        successCount++;
      } catch (err) {
        console.error(`❌ ${user.email} 오류: ${err.message}`);
      }
    }

    console.log(`\n✨ 항공사 할당 완료:`);
    console.log(`   성공: ${successCount}명`);
    console.log(`   건너뛰기: ${skipCount}명`);

    if (successCount > 0) {
      console.log('\n🎉 모든 사용자에게 항공사를 할당했습니다!');
    }

    await dbClient.end();
  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
    process.exit(1);
  }
}

main();
