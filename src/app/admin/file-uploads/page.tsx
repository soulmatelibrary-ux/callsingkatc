'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminFileUploadsPage() {
  const router = useRouter();

  useEffect(() => {
    // /admin/callsign-management으로 리다이렉트
    router.replace('/admin/callsign-management');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-sm font-semibold text-gray-500">이동 중...</p>
    </div>
  );
}
