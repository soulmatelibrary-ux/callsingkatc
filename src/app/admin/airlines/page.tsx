"use client";

import { Header } from "@/components/layout/Header";
import { AirlinesAdminSection } from "@/components/admin/AirlinesAdminSection";

export default function AirlinesAdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-20 pb-10">
        <AirlinesAdminSection />
      </main>
    </div>
  );
}
