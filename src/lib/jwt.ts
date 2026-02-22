/**
 * JWT 토큰 생성 및 검증
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES = '1h';
const REFRESH_TOKEN_EXPIRES = '7d';

/**
 * JWT_SECRET 검증 (런타임)
 */
function validateJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. 보안상 필수 설정입니다.');
  }
  return JWT_SECRET;
}

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
  const secret = validateJwtSecret();
  return jwt.sign(payload, secret, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
}

/**
 * refreshToken 생성
 */
export function generateRefreshToken(userId: string): string {
  const secret = validateJwtSecret();
  return jwt.sign({ userId }, secret, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });
}

/**
 * 토큰 검증
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const secret = validateJwtSecret();
    const decoded = jwt.verify(token, secret) as TokenPayload;
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
    const secret = validateJwtSecret();
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded;
  } catch (error) {
    console.error('리프레시 토큰 검증 실패:', error);
    return null;
  }
}
