/**
 * callsigns 테이블의 모든 status를 'in_progress'로 리셋
 * 사용: node scripts/reset-callsigns-status.js
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'katc1_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function resetCallsignsStatus() {
  const client = await pool.connect();
  try {
    console.log('🔄 callsigns 상태 리셋 중...');

    // 1. 모든 callsigns를 'in_progress'로 업데이트
    const updateResult = await client.query(
      `UPDATE callsigns SET status = 'in_progress' WHERE status IS NULL OR status = 'completed'`
    );
    console.log(`✅ ${updateResult.rowCount}개 행 업데이트됨`);

    // 2. 현재 상태 확인
    const countResult = await client.query(
      `SELECT COUNT(*) as total, status FROM callsigns GROUP BY status`
    );
    console.log('📊 현재 상태:');
    countResult.rows.forEach((row) => {
      console.log(`   status: ${row.status} → ${row.total}개`);
    });

    // 3. 전체 개수
    const totalResult = await client.query(`SELECT COUNT(*) as total FROM callsigns`);
    console.log(`\n✨ 총 ${totalResult.rows[0].total}개의 호출부호가 'in_progress' 상태입니다`);
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

resetCallsignsStatus();
