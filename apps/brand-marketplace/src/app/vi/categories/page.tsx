import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_CATEGORIES } from "@omdala/brand-core";
import { categoryHref, localize } from "@/lib/locale";

export const metadata: Metadata = { title: "Danh mục thương hiệu" };

export default function VietnameseCategoriesPage() {
  return (
    <main className="market-information" lang="vi">
      <header><p className="market-eyebrow">Bản đồ inventory</p><h1>Khám phá theo bề mặt vận hành.</h1><p className="market-information__lead">Danh mục tổ chức private inventory đã duyệt, không khẳng định mọi danh mục đều đang có tài sản công khai.</p></header>
      <div className="category-rail market-category-index">
        {BRAND_CATEGORIES.map((category, index) => <Link className="category-rail__item" href={categoryHref("vi", category.slug)} key={category.id}><span>0{index + 1}</span><strong>{category.name}</strong><small>{localize(category.description, "vi")}</small></Link>)}
      </div>
    </main>
  );
}
