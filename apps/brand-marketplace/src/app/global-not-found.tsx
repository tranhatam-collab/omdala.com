import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 — Not found / Không tìm thấy | OMDALA Brand Exchange",
  robots: { index: false, follow: false },
};

// One static 404.html serves every unknown URL, so it shows both languages, each block tagged.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="market-information">
          <section lang="en">
            <p className="market-eyebrow">404</p>
            <h1>This listing is not public.</h1>
            <p className="market-information__lead">The route may be unavailable, unpublished, or outside the current private inventory.</p>
            <Link className="market-button market-button--solid" href="/en/brands">Browse approved brands</Link>
          </section>
          <section lang="vi">
            <h2>Niêm yết này không công khai.</h2>
            <p className="market-information__lead">Đường dẫn có thể không khả dụng, chưa được đăng hoặc nằm ngoài kho thương hiệu riêng tư hiện tại.</p>
            <Link className="market-button market-button--solid" href="/vi/brands">Xem các thương hiệu đã duyệt</Link>
          </section>
        </main>
      </body>
    </html>
  );
}
