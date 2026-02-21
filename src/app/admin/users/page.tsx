import AdminUsersPageClient from "./client";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tabParam = params.tab;

  return <AdminUsersPageClient initialTab={tabParam} />;
}
