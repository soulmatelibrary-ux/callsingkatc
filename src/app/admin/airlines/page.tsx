"use client";

import { AirlinesAdminSection } from "@/components/admin/AirlinesAdminSection";

export default function AirlinesAdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 w-full px-4 sm:px-6 pb-10">
        <AirlinesAdminSection />
      </main>
    </div>
  );
}
