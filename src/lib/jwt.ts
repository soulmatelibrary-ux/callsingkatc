/**
 * JWT 토큰 생성 및 검증
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';
const ACCESS_TOKEN_EXPIRES = '1h';
const REFRESH_TOKEN_EXPIRES = '7d';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  airlineId?: string;
}

/**
 * accessToken 생성
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

/**
 * refreshToken 생성
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

/**
 * 토큰 검증
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return null;
  }
}

/**
 * refreshToken에서 userId 추출
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    console.error('리프레시 토큰 검증 실패:', error);
    return null;
  }
}
