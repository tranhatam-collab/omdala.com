import {
  withLanguagePath,
  type OmdalaLanguage,
} from "@omdala/core";
import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, PropsWithChildren } from "react";

type LocaleLinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
    LinkProps & {
      href: string;
      language?: OmdalaLanguage;
    }
>;

export function LocaleLink({
  href,
  language = "en",
  children,
  ...props
}: LocaleLinkProps) {
  const localizedHref = withLanguagePath(href, language);

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}
