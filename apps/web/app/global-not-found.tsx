import type { Metadata } from "next";
import { NotFoundWrapper } from "./components/NotFoundWrapper";
import "../../../packages/ui/src/fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Trang không tồn tại | OMDALA",
  robots: { index: false, follow: false },
};

// One static 404.html serves every unknown URL. NotFoundWrapper renders Vietnamese unless the
// path starts with /en, which is also what this build-time render produces, so lang matches.
export default function GlobalNotFound() {
  return (
    <html lang="vi">
      <body>
        <NotFoundWrapper />
      </body>
    </html>
  );
}
