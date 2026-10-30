import type { Metadata } from "next";
import { BilingualNotFoundView } from "./components/NotFoundView";
import "../../../packages/ui/src/fonts.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Page not found / Trang không tồn tại | OMDALA",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <BilingualNotFoundView />
      </body>
    </html>
  );
}
