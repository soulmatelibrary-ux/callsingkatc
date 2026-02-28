/**
 * SQLite 스키마 초기화
 * PostgreSQL init.sql을 SQLite 호환 형식으로 변환
 */

import Database from 'better-sqlite3';

export function initializeSchema(database: Database.Database) {
  try {
    // 테이블 존재 여부 확인
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as any[];

    if (tables.length > 0) {
      console.log('[SQLite] 스키마가 이미 존재합니다. 누락 테이블 확인 중...');
      // 누락된 테이블 생성 (마이그레이션 지원)
      ensureMissingTables(database);
      return;
    }

    console.log('[SQLite] 스키마 초기화 중...');

    // 트랜잭션 시작
    database.exec('BEGIN TRANSACTION');

    try {
      createTables(database);
      createIndexes(database);
      insertSampleData(database);

      database.exec('COMMIT');
      console.log('[SQLite] 스키마 초기화 완료');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('[SQLite] 스키마 초기화 오류:', error.message);
    throw error;
  }
}

/**
 * 기존 데이터베이스에서 누락된 테이블 생성 (마이그레이션)
 */
function ensureMissingTables(database: Database.Database) {
  try {
    const existingTables = database
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((t: any) => t.name) as string[];

    const requiredTables = [
      'airlines',
      'users',
      'password_history',
      'audit_logs',
      'file_uploads',
      'callsigns',
      'callsign_occurrences',
      'actions',
      'action_history',
      'announcements',
      'announcement_views',
    ];

    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('[SQLite] 모든 필수 테이블이 존재합니다.');
      return;
    }

    console.log(`[SQLite] 누락된 테이블 감지: ${missingTables.join(', ')}`);

    // 누락된 테이블 생성
    if (missingTables.includes('password_history')) {
      database.exec(`
        CREATE TABLE IF NOT EXISTS password_history (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          user_id TEXT NOT NULL REFERENCES users(id),
          password_hash VARCHAR(255) NOT NULL,
          changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          changed_by VARCHAR(50)
        )
      `);
      console.log('[SQLite] password_history 테이블 생성 완료');
    }

    // 인덱스 재생성
    database.exec('CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id)');

  } catch (error: any) {
    console.error('[SQLite] 누락 테이블 생성 오류:', error.message);
    throw error;
  }
}

function createTables(database: Database.Database) {
  // 1. Airlines 테이블
  database.exec(`
    CREATE TABLE airlines (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      code VARCHAR(10) UNIQUE NOT NULL,
      name_ko VARCHAR(100) NOT NULL,
      name_en VARCHAR(100),
      display_order INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Users 테이블
  database.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      airline_id TEXT NOT NULL REFERENCES airlines(id),
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      is_default_password BOOLEAN DEFAULT true,
      password_change_required BOOLEAN DEFAULT true,
      last_password_changed_at DATETIME,
      last_login_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Password History 테이블
  database.exec(`
    CREATE TABLE password_history (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL REFERENCES users(id),
      password_hash VARCHAR(255) NOT NULL,
      changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      changed_by VARCHAR(50)
    )
  `);

  // 4. Audit Logs 테이블
  database.exec(`
    CREATE TABLE audit_logs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id),
      action VARCHAR(50) NOT NULL,
      table_name VARCHAR(50),
      old_data TEXT,
      new_data TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. File Uploads 테이블
  database.exec(`
    CREATE TABLE file_uploads (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      file_name VARCHAR(255) NOT NULL,
      file_size INT,
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total_rows INT DEFAULT 0,
      success_count INT DEFAULT 0,
      failed_count INT DEFAULT 0,
      error_message TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      processed_at DATETIME
    )
  `);

  // 6. Callsigns 테이블
  database.exec(`
    CREATE TABLE callsigns (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      airline_id TEXT NOT NULL REFERENCES airlines(id),
      airline_code VARCHAR(10) NOT NULL,
      callsign_pair VARCHAR(50) NOT NULL,
      my_callsign VARCHAR(20) NOT NULL,
      other_callsign VARCHAR(20) NOT NULL,
      other_airline_code VARCHAR(10),
      sector VARCHAR(20),
      departure_airport1 VARCHAR(10),
      arrival_airport1 VARCHAR(10),
      departure_airport2 VARCHAR(10),
      arrival_airport2 VARCHAR(10),
      same_airline_code VARCHAR(10),
      same_callsign_length VARCHAR(10),
      same_number_position VARCHAR(20),
      same_number_count INT,
      same_number_ratio DECIMAL(5,2),
      similarity VARCHAR(20),
      max_concurrent_traffic INT,
      coexistence_minutes INT,
      error_probability INT,
      atc_recommendation VARCHAR(50),
      error_type VARCHAR(30),
      sub_error VARCHAR(30),
      risk_level VARCHAR(20),
      occurrence_count INT DEFAULT 0,
      first_occurred_at DATETIME,
      last_occurred_at DATETIME,
      file_upload_id TEXT REFERENCES file_uploads(id),
      uploaded_at DATETIME,
      status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
      my_action_status VARCHAR(20) DEFAULT 'no_action' CHECK (my_action_status IN ('no_action', 'pending', 'in_progress', 'completed')),
      other_action_status VARCHAR(20) DEFAULT 'no_action' CHECK (other_action_status IN ('no_action', 'pending', 'in_progress', 'completed')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(airline_id, callsign_pair),
      UNIQUE(airline_code, callsign_pair)
    )
  `);

  // 7. Callsign Occurrences 테이블
  database.exec(`
    CREATE TABLE callsign_occurrences (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      callsign_id TEXT NOT NULL REFERENCES callsigns(id),
      occurred_date DATE NOT NULL,
      occurred_time DATETIME,
      error_type VARCHAR(30),
      sub_error VARCHAR(30),
      location VARCHAR(100),
      flight_level VARCHAR(20),
      file_upload_id TEXT REFERENCES file_uploads(id),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(callsign_id, occurred_date)
    )
  `);

  // 8. Actions 테이블
  database.exec(`
    CREATE TABLE actions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      airline_id TEXT NOT NULL REFERENCES airlines(id),
      callsign_id TEXT NOT NULL REFERENCES callsigns(id),
      action_type VARCHAR(100) NOT NULL,
      description TEXT,
      manager_name VARCHAR(100),
      manager_email VARCHAR(255),
      planned_due_date DATE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
      result_detail TEXT,
      completed_at DATETIME,
      registered_by TEXT NOT NULL REFERENCES users(id),
      registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      reviewed_by TEXT REFERENCES users(id),
      reviewed_at DATETIME,
      review_comment TEXT
    )
  `);

  // 9. Action History 테이블
  database.exec(`
    CREATE TABLE action_history (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      action_id TEXT NOT NULL REFERENCES actions(id),
      changed_by TEXT REFERENCES users(id),
      changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      field_name VARCHAR(50),
      old_value TEXT,
      new_value TEXT
    )
  `);

  // 10. Announcements 테이블
  database.exec(`
    CREATE TABLE announcements (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      level VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (level IN ('warning', 'info', 'success')),
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT true,
      target_airlines TEXT,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT REFERENCES users(id),
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 11. Announcement Views 테이블
  database.exec(`
    CREATE TABLE announcement_views (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      announcement_id TEXT NOT NULL REFERENCES announcements(id),
      user_id TEXT NOT NULL REFERENCES users(id),
      viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      dismissed_at DATETIME,
      UNIQUE(announcement_id, user_id)
    )
  `);
}

function createIndexes(database: Database.Database) {
  database.exec(`
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_airline_id ON users(airline_id);
    CREATE INDEX idx_users_status ON users(status);
    CREATE INDEX idx_users_created_at ON users(created_at DESC);
    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_airlines_code ON airlines(code);
    CREATE INDEX idx_password_history_user_id ON password_history(user_id);
    CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX idx_file_uploads_uploaded_at ON file_uploads(uploaded_at DESC);
    CREATE INDEX idx_file_uploads_status ON file_uploads(status);
    CREATE INDEX idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
    CREATE INDEX idx_callsigns_airline_id ON callsigns(airline_id);
    CREATE INDEX idx_callsigns_airline_code ON callsigns(airline_code);
    CREATE INDEX idx_callsigns_pair ON callsigns(callsign_pair);
    CREATE INDEX idx_callsigns_risk_level ON callsigns(risk_level);
    CREATE INDEX idx_callsigns_status ON callsigns(status);
    CREATE INDEX idx_callsigns_created_at ON callsigns(created_at DESC);
    CREATE INDEX idx_callsign_occurrences_callsign_id ON callsign_occurrences(callsign_id);
    CREATE INDEX idx_callsign_occurrences_occurred_date ON callsign_occurrences(occurred_date DESC);
    CREATE INDEX idx_actions_airline_id ON actions(airline_id);
    CREATE INDEX idx_actions_callsign_id ON actions(callsign_id);
    CREATE INDEX idx_actions_status ON actions(status);
    CREATE INDEX idx_actions_registered_by ON actions(registered_by);
    CREATE INDEX idx_actions_registered_at ON actions(registered_at DESC);
    CREATE INDEX idx_actions_completed_at ON actions(completed_at DESC);
    CREATE INDEX idx_action_history_action_id ON action_history(action_id);
    CREATE INDEX idx_action_history_changed_at ON action_history(changed_at DESC);
    CREATE INDEX idx_announcements_start_date ON announcements(start_date);
    CREATE INDEX idx_announcements_end_date ON announcements(end_date);
    CREATE INDEX idx_announcements_is_active ON announcements(is_active);
    CREATE INDEX idx_announcements_level ON announcements(level);
    CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
    CREATE INDEX idx_announcements_created_by ON announcements(created_by);
    CREATE INDEX idx_announcement_views_announcement_id ON announcement_views(announcement_id);
    CREATE INDEX idx_announcement_views_user_id ON announcement_views(user_id);
    CREATE INDEX idx_announcement_views_viewed_at ON announcement_views(viewed_at DESC);
  `);
}

function insertSampleData(database: Database.Database) {
  console.log('[SQLite] 샘플 데이터 삽입 중...');

  // 항공사 데이터
  const airlines = [
    { code: 'KAL', name_ko: '대한항공', name_en: 'KOREAN AIR', display_order: 1 },
    { code: 'AAR', name_ko: '아시아나항공', name_en: 'ASIANA AIRLINES', display_order: 2 },
    { code: 'JJA', name_ko: '제주항공', name_en: 'JEJUair', display_order: 3 },
    { code: 'JNA', name_ko: '진에어', name_en: 'JIN AIR', display_order: 4 },
    { code: 'TWB', name_ko: '티웨이항공', name_en: 't\'way Air', display_order: 5 },
    { code: 'ABL', name_ko: '에어부산', name_en: 'AIR BUSAN', display_order: 6 },
    { code: 'ASV', name_ko: '에어서울', name_en: 'AIR SEOUL', display_order: 7 },
    { code: 'EOK', name_ko: '이스타항공', name_en: 'EASTAR JET', display_order: 8 },
    { code: 'FGW', name_ko: '플라이강원', name_en: 'Aero K', display_order: 9 },
    { code: 'APZ', name_ko: '에어프레미아', name_en: 'Air Premia', display_order: 10 },
    { code: 'ESR', name_ko: '이스타항공', name_en: 'EASTAR JET', display_order: 11 },
  ];

  const insertAirlineStmt = database.prepare(
    'INSERT OR IGNORE INTO airlines (code, name_ko, name_en, display_order) VALUES (?, ?, ?, ?)'
  );

  airlines.forEach(airline => {
    insertAirlineStmt.run(airline.code, airline.name_ko, airline.name_en, airline.display_order);
  });

  // 비밀번호 "1234"의 bcrypt 해시
  const hash1234 = '$2b$10$8u0KODIbldb.4gvwdHYPzeDWrlbj9bSjH4CTzUN23kywMi3z/dDUm';

  // 사용자 데이터
  const users = [
    // 관리자 계정 (2명)
    { email: 'lsi117@airport.co.kr', password_hash: hash1234, airline_code: 'KAL', role: 'admin' },
    { email: 'parkeungi21@korea.kr', password_hash: hash1234, airline_code: 'KAL', role: 'admin' },
    // 항공사별 계정 (11개 항공사)
    { email: 'kal@test.com', password_hash: hash1234, airline_code: 'KAL', role: 'user' },
    { email: 'aar@test.com', password_hash: hash1234, airline_code: 'AAR', role: 'user' },
    { email: 'jja@test.com', password_hash: hash1234, airline_code: 'JJA', role: 'user' },
    { email: 'jna@test.com', password_hash: hash1234, airline_code: 'JNA', role: 'user' },
    { email: 'twb@test.com', password_hash: hash1234, airline_code: 'TWB', role: 'user' },
    { email: 'abl@test.com', password_hash: hash1234, airline_code: 'ABL', role: 'user' },
    { email: 'asv@test.com', password_hash: hash1234, airline_code: 'ASV', role: 'user' },
    { email: 'eok@test.com', password_hash: hash1234, airline_code: 'EOK', role: 'user' },
    { email: 'fgw@test.com', password_hash: hash1234, airline_code: 'FGW', role: 'user' },
    { email: 'apz@test.com', password_hash: hash1234, airline_code: 'APZ', role: 'user' },
    { email: 'esr@test.com', password_hash: hash1234, airline_code: 'ESR', role: 'user' },
  ];

  const insertUserStmt = database.prepare(`
    INSERT OR IGNORE INTO users (email, password_hash, airline_id, status, role, is_default_password, password_change_required)
    SELECT ?, ?, airlines.id, 'active', ?, false, false
    FROM airlines WHERE airlines.code = ?
  `);

  users.forEach(user => {
    insertUserStmt.run(user.email, user.password_hash, user.role, user.airline_code);
  });

  console.log('[SQLite] 샘플 데이터 삽입 완료');
}
