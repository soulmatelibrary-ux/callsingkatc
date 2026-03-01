/**
 * POST /api/auth/forgot-password
 * 비밀번호 찾기 (임시 비밀번호 생성 + 이메일 발송)
 *
 * 보안 정책:
 * - 이메일 존재 여부를 응답에서 노출하지 않음 (열거 공격 방어)
 * - 항상 200 OK 반환
 * - Nodemailer를 통해 Gmail SMTP로 실제 이메일 발송
 *
 * 요청 본문:
 *   { email: string }
 *
 * 응답:
 *   { message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { sendTempPasswordEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/** 임시 비밀번호 생성 (8자 이상, 대소문자+숫자+특수문자 조합) */
function generateTempPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';

  // crypto.getRandomValues를 사용한 암호학적으로 안전한 난수 생성
  const getRandomChar = (chars: string): string => {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    return chars[randomValues[0] % chars.length];
  };

  // 각 카테고리에서 최소 1개 보장
  const required = [
    getRandomChar(upper),
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(lower),
    getRandomChar(digits),
    getRandomChar(digits),
    getRandomChar(special),
    getRandomChar(special),
  ];

  // 나머지 4자 랜덤
  const allChars = upper + lower + digits + special;
  for (let i = 0; i < 4; i++) {
    required.push(getRandomChar(allChars));
  }

  // Fisher-Yates 셔플 (암호학적으로 안전)
  const shuffled = required.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    const j = randomValues[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.join('');
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 기본 유효성 검사
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '유효한 이메일을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 조회 (이메일 존재 여부는 응답에 노출하지 않음)
    const result = await query(
      'SELECT id, email, status FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // 정지된 계정은 임시 비밀번호 발급 제외 (보안)
      if (user.status !== 'suspended') {
        // 임시 비밀번호 생성
        const tempPassword = generateTempPassword();

        // 비밀번호 해시
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // DB 업데이트: 비밀번호 교체 + 변경 강제 플래그 설정
        await query(
          `UPDATE users
           SET password_hash = ?,
               is_default_password = true,
               password_change_required = true,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [passwordHash, user.id]
        );

        // 이메일 발송 (스텁)
        await sendTempPasswordEmail(email, tempPassword);
      }
    }

    // 열거 공격 방어: 이메일 존재 여부에 관계없이 동일 메시지 반환
    return NextResponse.json(
      {
        message:
          '이메일이 등록되어 있다면 임시 비밀번호를 발송했습니다. 로그인 후 반드시 비밀번호를 변경해주세요.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('forgot-password 오류:', error);
    return NextResponse.json(
      { error: '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
