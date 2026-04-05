"use client";

import {
  ANGEL_EDU_TAM_FOUNDATION,
  resolveLanguage,
  type OmdalaLanguage,
} from "@omdala/core";
import { OMDALA_PAGES } from "@omdala/seo";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LocaleLink } from "./components/LocaleLink";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

const COPY: Record<OmdalaLanguage, any> = {
  en: {
    nav: {
      what: "What it is",
      how: "How it works",
      experts: "Experts",
      hosts: "Hosts",
      communities: "Communities",
      trust: "Trust",
      vision: "Vision",
    },
    enterApp: "Enter App",
    footerEyebrow: "Master Platform",
    footerLead:
      "The operating layer for real-world value, trust, and intelligent coordination.",
    platform: "Platform",
    whatIsOmdala: "What OMDALA is",
    trustArchitecture: "Trust architecture",
    surfaces: "Surfaces",
    apiHealth: "API health",
    legalSection: "Legal",
    legalEmailLabel: "Email:",
    legalWebLabel: "Web:",
  },
  vi: {
    nav: {
      what: "OMDALA là gì",
      how: "Cách vận hành",
      experts: "Chuyên gia",
      hosts: "Điểm đón",
      communities: "Cộng đồng",
      trust: "Niềm tin",
      vision: "Tầm nhìn",
    },
    enterApp: "Vào ứng dụng",
    footerEyebrow: "Nền tảng chủ",
    footerLead:
      "Lớp vận hành cho giá trị đời thực, niềm tin và điều phối thông minh.",
    platform: "Nền tảng",
    whatIsOmdala: "OMDALA là gì",
    trustArchitecture: "Kiến trúc niềm tin",
    surfaces: "Bề mặt hệ thống",
    apiHealth: "Trạng thái API",
    legalSection: "Pháp lý",
    legalEmailLabel: "Email:",
    legalWebLabel: "Web:",
  },
  zh: {
    nav: {
      what: "什么是 OMDALA",
      how: "工作原理",
      experts: "专家",
      hosts: "主机",
      communities: "社区",
      trust: "信任",
      vision: "愿景",
    },
    enterApp: "进入应用",
    footerEyebrow: "主平台",
    footerLead: "真实世界价值、信任和智能协调的运营层。",
    platform: "平台",
    whatIsOmdala: "什么是 OMDALA",
    trustArchitecture: "信任架构",
    surfaces: "系统表面",
    apiHealth: "API 健康状态",
    legalSection: "法律",
    legalEmailLabel: "电子邮件:",
    legalWebLabel: "网站:",
  },
  es: {
    nav: {
      what: "Qué es",
      how: "Cómo funciona",
      experts: "Expertos",
      hosts: "Anfitriones",
      communities: "Comunidades",
      trust: "Confianza",
      vision: "Visión",
    },
    enterApp: "Entrar a la App",
    footerEyebrow: "Plataforma Maestra",
    footerLead:
      "La capa operativa para el valor del mundo real, la confianza y la coordinación inteligente.",
    platform: "Plataforma",
    whatIsOmdala: "Qué es OMDALA",
    trustArchitecture: "Arquitectura de confianza",
    surfaces: "Superficies",
    apiHealth: "Salud de API",
    legalSection: "Legal",
    legalEmailLabel: "Correo:",
    legalWebLabel: "Web:",
  },
  ja: {
    nav: {
      what: "OMDALAとは",
      how: "仕組み",
      experts: "専門家",
      hosts: "ホスト",
      communities: "コミュニティ",
      trust: "信頼",
      vision: "ビジョン",
    },
    enterApp: "アプリを開く",
    footerEyebrow: "マスタープラットフォーム",
    footerLead:
      "現実世界の価値、信頼、インテリジェントな調整のためのオペレーティングレイヤー。",
    platform: "プラットフォーム",
    whatIsOmdala: "OMDALAとは",
    trustArchitecture: "信頼アーキテクチャ",
    surfaces: "システムサーフェス",
    apiHealth: "APIステータス",
    legalSection: "法的情報",
    legalEmailLabel: "メール:",
    legalWebLabel: "ウェブ:",
  },
  ko: {
    nav: {
      what: "OMDALA란",
      how: "작동 방식",
      experts: "전문가",
      hosts: "호스트",
      communities: "커뮤니티",
      trust: "신뢰",
      vision: "비전",
    },
    enterApp: "앱 입장",
    footerEyebrow: "마스터 플랫폼",
    footerLead: "현실 세계의 가치, 신뢰 및 지능형 조정을 위한 운영 레이어.",
    platform: "플랫폼",
    whatIsOmdala: "OMDALA란",
    trustArchitecture: "신뢰 아키텍처",
    surfaces: "시스템 표면",
    apiHealth: "API 상태",
    legalSection: "법적 정보",
    legalEmailLabel: "이메일:",
    legalWebLabel: "웹:",
  },
};

const primaryNavigation = [
  { key: "what", href: OMDALA_PAGES.whatIsOmdala },
  { key: "how", href: OMDALA_PAGES.howItWorks },
  { key: "experts", href: OMDALA_PAGES.forExperts },
  { key: "hosts", href: OMDALA_PAGES.forHosts },
  { key: "communities", href: OMDALA_PAGES.forCommunities },
  { key: "trust", href: OMDALA_PAGES.trust },
  { key: "vision", href: OMDALA_PAGES.vision },
] as const;

export function WebChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<OmdalaLanguage>("en");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const lang = resolveLanguage(
      new URLSearchParams(window.location.search).get("lang"),
    );
    setLanguage(lang);
  }, [pathname]);

  useEffect(() => {
    function handleLanguageChanged(event: Event) {
      const customEvent = event as CustomEvent<{ language?: OmdalaLanguage }>;
      const nextLanguage = customEvent.detail?.language;
      if (nextLanguage) {
        setLanguage(resolveLanguage(nextLanguage));
      }
    }

    window.addEventListener("omdala:language-changed", handleLanguageChanged);
    return () =>
      window.removeEventListener(
        "omdala:language-changed",
        handleLanguageChanged,
      );
  }, []);

  const text = COPY[language] || COPY.en;

  return (
    <>
      <header className="site-header">
        <div className="site-shell site-header__inner">
          <LocaleLink
            href={OMDALA_PAGES.home}
            className="brand-mark"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Image
              src="/logo.svg"
              alt="OMDALA"
              width={24}
              height={24}
              className="brand-icon"
            />
            <span>OMDALA</span>
          </LocaleLink>

          <nav className="site-nav" aria-label="Primary">
            {primaryNavigation.map((item) => (
              <LocaleLink key={item.href} href={item.href}>
                {text.nav[item.key]}
              </LocaleLink>
            ))}
          </nav>

          <div className="site-header__actions">
            <LanguageSwitcher />
            <a
              href="https://app.omdala.com"
              className="site-button site-button--ghost"
            >
              {text.enterApp}
            </a>
          </div>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div className="site-shell footer-grid">
          <div className="footer-block">
            <p className="eyebrow">{text.footerEyebrow}</p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
              }}
            >
              <Image src="/logo.svg" alt="OMDALA" width={24} height={24} />
              <h2>OMDALA</h2>
            </div>
            <p className="section-copy">{text.footerLead}</p>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.platform}</p>
            <LocaleLink href={OMDALA_PAGES.whatIsOmdala}>
              {text.whatIsOmdala}
            </LocaleLink>
            <LocaleLink href={OMDALA_PAGES.howItWorks}>
              {text.nav.how}
            </LocaleLink>
            <LocaleLink href={OMDALA_PAGES.trust}>
              {text.trustArchitecture}
            </LocaleLink>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.surfaces}</p>
            <a href="https://app.omdala.com">App</a>
            <a href="https://docs.omdala.com">Docs</a>
            <a href="https://api.omdala.com/health">{text.apiHealth}</a>
          </div>

          <div className="footer-block">
            <p className="footer-heading">{text.legalSection}</p>
            <p className="section-copy">{ANGEL_EDU_TAM_FOUNDATION.legalName}</p>
            <p className="section-copy">
              <span className="footer-legal-label">{text.legalEmailLabel}</span>{" "}
              <a href={`mailto:${ANGEL_EDU_TAM_FOUNDATION.email}`}>
                {ANGEL_EDU_TAM_FOUNDATION.email}
              </a>
            </p>
            <p className="section-copy">
              <span className="footer-legal-label">{text.legalWebLabel}</span>{" "}
              <a
                href={ANGEL_EDU_TAM_FOUNDATION.websiteUrl}
                rel="noopener noreferrer"
              >
                {ANGEL_EDU_TAM_FOUNDATION.websiteDisplay}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
