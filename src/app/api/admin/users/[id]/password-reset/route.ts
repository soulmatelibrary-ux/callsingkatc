/**
 * PUT /api/admin/users/[id]/password-reset
 * 관리자 - 특정 사용자 비밀번호 초기화
 *
 * - 초기화 비밀번호: {항공사코드}1234! 형식
 * - password_change_required = true 설정
 * - 초기화된 비밀번호 규칙을 응답에 포함 (관리자가 사용자에게 전달)
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

    // 대상 사용자와 항공사 정보 조회
    const userResult = await query(
      `SELECT u.id, u.email, u.status, u.role, u.airline_id, a.code as airline_code
       FROM users u
       LEFT JOIN airlines a ON u.airline_id = a.id
       WHERE u.id = ?`,
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

    // 항공사 코드 확인
    if (!targetUser.airline_code) {
      return NextResponse.json(
        { error: '사용자의 항공사 정보를 찾을 수 없습니다.' },
        { status: 400 }
      );
    }

    // 📌 초기화 비밀번호: {항공사코드}1234! 형식
    const resetPassword = `${targetUser.airline_code}1234!`;
    const passwordHash = await bcrypt.hash(resetPassword, 10);

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
      resetPasswordFormat: `{항공사코드}1234!`,
      example: resetPassword,
      hint: `사용자의 항공사코드: ${targetUser.airline_code}`,
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
