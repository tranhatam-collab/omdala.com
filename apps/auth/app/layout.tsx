import type { Metadata } from "next";
import { AUTH_COPY, DocumentLanguageSync } from "@omdala/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "OMDALA Auth",
    template: "%s - OMDALA Auth",
  },
  description: AUTH_COPY.authHostLoginPage.body.en,
  robots: { index: false, follow: false },
};

export default function AuthRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DocumentLanguageSync />
        {children}
      </body>
    </html>
  );
}
