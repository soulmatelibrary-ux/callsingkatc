/**
 * PUT /api/admin/users/[id]/password-reset
 * 관리자 - 특정 사용자 비밀번호 초기화
 *
 * - 임시 비밀번호를 생성하여 DB에 저장
 * - password_change_required = true 설정
 * - 임시 비밀번호를 응답에 포함 (관리자가 사용자에게 전달)
 *
 * 권한: admin 전용
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Params {
  params: {
    id: string;
  };
}

/** 임시 비밀번호 생성 */
function generateTempPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';

  const getRandom = (chars: string) =>
    chars[Math.floor(Math.random() * chars.length)];

  const required = [
    getRandom(upper),
    getRandom(upper),
    getRandom(lower),
    getRandom(lower),
    getRandom(digits),
    getRandom(digits),
    getRandom(special),
    getRandom(special),
  ];

  const allChars = upper + lower + digits + special;
  for (let i = 0; i < 4; i++) {
    required.push(getRandom(allChars));
  }

  return required.sort(() => Math.random() - 0.5).join('');
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자만 접근 가능합니다.' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // 대상 사용자 존재 여부 확인
    const userResult = await query(
      'SELECT id, email, status, role FROM users WHERE id = ?',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const targetUser = userResult.rows[0];

    // 자기 자신의 비밀번호는 이 API로 초기화 불가 (보안)
    if (targetUser.id === payload.userId) {
      return NextResponse.json(
        { error: '자신의 비밀번호는 비밀번호 변경 화면을 이용해주세요.' },
        { status: 400 }
      );
    }

    // 임시 비밀번호 생성
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // DB 업데이트
    await query(
      `UPDATE users
       SET password_hash = ?,
           is_default_password = true,
           password_change_required = true,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [passwordHash, userId]
    );

    return NextResponse.json({
      message: '비밀번호가 초기화되었습니다.',
      email: targetUser.email,
      tempPassword,
    });
  } catch (error) {
    console.error('비밀번호 초기화 오류:', error);
    return NextResponse.json(
      { error: '비밀번호 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/** PATCH도 동일하게 지원 */
export { PUT as PATCH };
