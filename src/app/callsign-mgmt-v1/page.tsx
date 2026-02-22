import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CallsignMgmtV1PublicLegacyPage() {
  redirect('/callsign-management');
}
