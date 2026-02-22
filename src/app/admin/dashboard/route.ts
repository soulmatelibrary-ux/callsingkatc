/**
 * Admin Dashboard 404 Handler
 * - /admin/dashboard 경로를 완전히 차단
 * - 모든 요청을 404로 반환
 */

import { notFound } from 'next/navigation';

export function GET() {
  notFound();
}

export function POST() {
  notFound();
}

export function PUT() {
  notFound();
}

export function DELETE() {
  notFound();
}

export function PATCH() {
  notFound();
}
