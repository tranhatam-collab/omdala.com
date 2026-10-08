import { getStaticSeoHeadProps } from "../lib/bilingual-source";
import { SeoHead } from "../seo-head";

export default function Head() {
  return <SeoHead {...getStaticSeoHeadProps("forHosts")} />;
}
