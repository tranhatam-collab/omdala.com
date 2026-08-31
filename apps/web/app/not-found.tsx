import type { Metadata } from "next";
import { NotFoundWrapper } from "./components/NotFoundWrapper";

export const metadata: Metadata = {
  title: "404 — Trang không tồn tại | OMDALA",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundWrapper />;
}
