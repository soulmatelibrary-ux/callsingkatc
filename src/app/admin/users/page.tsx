import { Header } from "@/components/layout/Header";
import AdminUsersPageClient from "./client";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tabParam = params.tab;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <AdminUsersPageClient initialTab={tabParam} />
    </div>
  );
}
