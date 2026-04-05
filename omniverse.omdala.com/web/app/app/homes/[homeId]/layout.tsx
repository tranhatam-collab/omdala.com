"use client";

import { use } from "react";
import { useAuthStore } from "@/store/authStore";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = use(params);
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-gray-950">
      <AppSidebar homeId={homeId} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
