import Link from "next/link";

export default function NotFound() {
  return <main className="market-information"><p className="market-eyebrow">404</p><h1>Niêm yết này không công khai.</h1><p className="market-information__lead">Đường dẫn có thể không khả dụng, chưa được đăng hoặc nằm ngoài kho thương hiệu riêng tư hiện tại.</p><Link className="market-button market-button--solid" href="/vi/brands">Xem các thương hiệu đã duyệt</Link></main>;
}
