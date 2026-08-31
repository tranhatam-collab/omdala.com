"use client";

import { SmartLayout } from "../components/SmartLayout";
import { Suspense } from "react";
import { DashboardAuthGate } from "./DashboardAuthGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#060d1a" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid rgba(126,242,255,0.15)",
                borderTopColor: "#7ef2ff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "#a8b9d0", fontSize: 14 }}>Đang tải...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
      }
    >
      <DashboardAuthGate>
        <SmartLayout>{children}</SmartLayout>
      </DashboardAuthGate>
    </Suspense>
  );
}
