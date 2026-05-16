"use client";

import { OMDALA_API_ORIGIN, resolveLanguage, type OmdalaLanguage } from "@omdala/core";
import type { OmAiProviderObservabilityResponse } from "@omdala/types";
import { useEffect, useState } from "react";

type ProviderObservabilityState = {
  status: "idle" | "loading" | "ready" | "error";
  data: OmAiProviderObservabilityResponse | null;
  error: string | null;
};

const COPY: Record<
  OmdalaLanguage,
  {
    eyebrow: string;
    title: string;
    lead: string;
    loading: string;
    source: string;
    syncedAt: string;
    routeDecisions: string;
    providerHealth: string;
    latency: string;
    errorRate: string;
    score: string;
    fallback: string;
    noFallback: string;
    noProvider: string;
    summary: {
      total: string;
      healthy: string;
      degraded: string;
      down: string;
    };
  }
> = {
  en: {
    eyebrow: "Provider Observability",
    title: "Provider routing health",
    lead: "Live view of registry source, routing decisions, and runtime metrics used by the API.",
    loading: "Loading live provider observability...",
    source: "Source",
    syncedAt: "Last synced",
    routeDecisions: "Route decisions",
    providerHealth: "Provider health",
    latency: "Latency",
    errorRate: "Error rate",
    score: "Score",
    fallback: "Fallback",
    noFallback: "No fallback",
    noProvider: "No provider selected",
    summary: {
      total: "Total providers",
      healthy: "Healthy",
      degraded: "Degraded",
      down: "Down",
    },
  },
  vi: {
    eyebrow: "Quan sát nhà cung cấp",
    title: "Sức khỏe định tuyến provider",
    lead: "Bảng live cho nguồn registry, quyết định định tuyến, và số liệu runtime mà API đang dùng.",
    loading: "Đang tải trạng thái provider live...",
    source: "Nguồn",
    syncedAt: "Đồng bộ lúc",
    routeDecisions: "Quyết định định tuyến",
    providerHealth: "Sức khỏe provider",
    latency: "Độ trễ",
    errorRate: "Tỷ lệ lỗi",
    score: "Điểm",
    fallback: "Fallback",
    noFallback: "Không có fallback",
    noProvider: "Chưa chọn provider",
    summary: {
      total: "Tổng provider",
      healthy: "Ổn định",
      degraded: "Suy giảm",
      down: "Ngưng hoạt động",
    },
  },
  zh: {
    eyebrow: "提供商可观测性",
    title: "提供商路由健康",
    lead: "实时查看 API 使用的注册表来源、路由决策和运行时指标。",
    loading: "正在加载实时提供商状态...",
    source: "来源",
    syncedAt: "最近同步",
    routeDecisions: "路由决策",
    providerHealth: "提供商健康",
    latency: "延迟",
    errorRate: "错误率",
    score: "评分",
    fallback: "回退",
    noFallback: "无回退",
    noProvider: "未选择提供商",
    summary: {
      total: "提供商总数",
      healthy: "健康",
      degraded: "降级",
      down: "停机",
    },
  },
  es: {
    eyebrow: "Observabilidad de proveedores",
    title: "Salud del enrutamiento de proveedores",
    lead: "Vista en vivo del origen del registro, decisiones de enrutamiento y métricas de ejecución usadas por la API.",
    loading: "Cargando observabilidad en vivo de proveedores...",
    source: "Origen",
    syncedAt: "Última sincronización",
    routeDecisions: "Decisiones de enrutamiento",
    providerHealth: "Salud del proveedor",
    latency: "Latencia",
    errorRate: "Tasa de error",
    score: "Puntaje",
    fallback: "Respaldo",
    noFallback: "Sin fallback",
    noProvider: "Ningún proveedor seleccionado",
    summary: {
      total: "Proveedores totales",
      healthy: "Saludables",
      degraded: "Degradados",
      down: "Caídos",
    },
  },
  ja: {
    eyebrow: "プロバイダー可観測性",
    title: "プロバイダールーティングの健全性",
    lead: "API が使用しているレジストリソース、ルーティング判断、ランタイム指標をライブ表示します。",
    loading: "ライブのプロバイダー状態を読み込み中...",
    source: "ソース",
    syncedAt: "最終同期",
    routeDecisions: "ルーティング判断",
    providerHealth: "プロバイダー状態",
    latency: "レイテンシ",
    errorRate: "エラー率",
    score: "スコア",
    fallback: "フォールバック",
    noFallback: "フォールバックなし",
    noProvider: "プロバイダー未選択",
    summary: {
      total: "総プロバイダー数",
      healthy: "正常",
      degraded: "劣化",
      down: "停止",
    },
  },
  ko: {
    eyebrow: "프로바이더 관측성",
    title: "프로바이더 라우팅 상태",
    lead: "API가 사용하는 레지스트리 소스, 라우팅 결정, 런타임 지표를 실시간으로 확인합니다.",
    loading: "실시간 프로바이더 상태를 불러오는 중...",
    source: "소스",
    syncedAt: "마지막 동기화",
    routeDecisions: "라우팅 결정",
    providerHealth: "프로바이더 상태",
    latency: "지연 시간",
    errorRate: "오류율",
    score: "점수",
    fallback: "대체 경로",
    noFallback: "대체 없음",
    noProvider: "선택된 프로바이더 없음",
    summary: {
      total: "전체 프로바이더",
      healthy: "정상",
      degraded: "저하",
      down: "중단",
    },
  },
};

export function ProviderObservabilityDashboard() {
  const [language, setLanguage] = useState<OmdalaLanguage>("en");
  const [state, setState] = useState<ProviderObservabilityState>({
    status: "idle",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setLanguage(resolveLanguage(new URLSearchParams(window.location.search).get("lang")));
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setState({
        status: "loading",
        data: null,
        error: null,
      });

      try {
        const response = await fetch(`${OMDALA_API_ORIGIN}/v1/providers/observability`, {
          credentials: "include",
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: OmAiProviderObservabilityResponse;
          error?: { message?: string };
        };

        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(payload.error?.message ?? "Unable to load provider observability.");
        }

        if (!mounted) {
          return;
        }

        setState({
          status: "ready",
          data: payload.data,
          error: null,
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setState({
          status: "error",
          data: null,
          error: error instanceof Error ? error.message : "Unable to load provider observability.",
        });
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const copy = COPY[language];
  const naLabel = language === "vi" ? "không có" : "n/a";

  return (
    <>
      <section className="admin-card">
        <p className="admin-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="admin-copy">{copy.lead}</p>
        {state.status === "loading" ? <p className="admin-copy">{copy.loading}</p> : null}
        {state.error ? <p className="admin-copy">{state.error}</p> : null}
      </section>

      {state.data ? (
        <>
          <section className="admin-grid">
            <article className="admin-stat">
              <strong>{copy.summary.total}</strong>
              <p>{state.data.summary.totalProviders}</p>
            </article>
            <article className="admin-stat">
              <strong>{copy.summary.healthy}</strong>
              <p>{state.data.summary.healthyProviders}</p>
            </article>
            <article className="admin-stat">
              <strong>{copy.summary.degraded}</strong>
              <p>{state.data.summary.degradedProviders}</p>
            </article>
            <article className="admin-stat">
              <strong>{copy.summary.down}</strong>
              <p>{state.data.summary.downProviders}</p>
            </article>
          </section>

          <section className="admin-card">
            <h2>{copy.routeDecisions}</h2>
            <p className="admin-copy">
              {copy.source}: {state.data.source}. {copy.syncedAt}: {state.data.lastSyncedAt}
            </p>
            <div className="admin-list">
              {state.data.routeDecisions.map((decision) => (
                <article key={decision.capability} className="admin-list-item">
                  <p className="admin-eyebrow">{decision.capability}</p>
                  <h3>{decision.providerName ?? copy.noProvider}</h3>
                  <p className="admin-copy">{decision.reason}</p>
                  <div className="admin-meta">
                    <span>{copy.score}: {decision.score.toFixed(3)}</span>
                    <span>
                      {copy.fallback}: {decision.fallbackProviderId ?? copy.noFallback}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-card">
            <h2>{copy.providerHealth}</h2>
            <div className="admin-list">
              {state.data.providers.map((provider) => (
                <article key={provider.id} className="admin-list-item">
                  <p className="admin-eyebrow">{provider.id}</p>
                  <h3>{provider.name}</h3>
                  <p className="admin-copy">{provider.capabilities.join(", ")}</p>
                  <div className="admin-meta">
                    <span>{copy.providerHealth}: {provider.health}</span>
                    <span>
                      {copy.latency}:{" "}
                      {provider.p95LatencyMs === null ? naLabel : `${provider.p95LatencyMs} ms`}
                    </span>
                    <span>
                      {copy.errorRate}:{" "}
                      {provider.errorRate === null ? naLabel : `${(provider.errorRate * 100).toFixed(1)}%`}
                    </span>
                    <span>
                      {copy.source}: {provider.source}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}
