// ─── useI18n — Language switcher EN/VI cho OMCODE Workspace ──────────────
import * as React from "react";

export type Lang = "en" | "vi";

const STORAGE_KEY = "omcode:lang";

const dict: Record<Lang, Record<string, string>> = {
  en: {
    workspace: "OMCODE Workspace",
    openProject: "Open Project",
    settings: "Settings",
    aiChat: "AI Chat",
    aiPalette: "AI Command Palette",
    terminal: "Terminal",
    explorer: "Explorer",
    git: "Git",
    editor: "Editor",
    welcomeTitle: "AI Code OS — Smart coding on your MacBook.",
    welcomeSubtitle: "Local-first. No login. Data never leaves your machine.",
    openFolder: "Open Project",
    recentProjects: "Recent Projects",
    shortcuts: "Shortcuts",
    settingsTitle: "OMCODE Settings",
    settingsHint: "API keys saved in localStorage on your machine (never sent to server).",
    apiKeyPlaceholder: "API Key",
    active: "Active",
    notConfigured: "Not configured",
    defaultModel: "Default model (Auto = Task Classifier chooses):",
    preferLocal: "Prefer local model (Ollama) as fallback",
    costThreshold: "Cost threshold (USD/request):",
    save: "Save Settings",
    saved: "Saved",
    close: "Close",
    customModel: "Custom Model",
    customModelName: "Model name (e.g. gpt-4-turbo):",
    customProvider: "Provider ID (e.g. openai):",
    customApiKey: "API Key for custom model:",
    addCustom: "Add custom model",
    askAI: "Ask AI about your workspace…",
    send: "Send",
    enterToSend: "Enter to send, Shift+Enter for new line",
    slashHint: "Type / for commands",
    modelUsed: "Model used",
    cost: "Cost",
    tokens: "Tokens",
    apply: "Apply",
    online: "Online",
    offline: "Offline",
    files: "files",
    changes: "changes",
  },
  vi: {
    workspace: "OMCODE Workspace",
    openProject: "Mở dự án",
    settings: "Cấu hình",
    aiChat: "AI Chat",
    aiPalette: "AI Command Palette",
    terminal: "Terminal",
    explorer: "Explorer",
    git: "Git",
    editor: "Editor",
    welcomeTitle: "AI Code OS — Viết code thông minh trên MacBook của bạn.",
    welcomeSubtitle: "Local-first. Không cần đăng nhập. Dữ liệu không rời máy.",
    openFolder: "Mở dự án",
    recentProjects: "Dự án gần đây",
    shortcuts: "Phím tắt nhanh",
    settingsTitle: "OMCODE Settings",
    settingsHint: "API keys lưu trong localStorage trên máy của bạn (không gửi lên server).",
    apiKeyPlaceholder: "API Key",
    active: "Đã cấu hình",
    notConfigured: "Chưa có API key",
    defaultModel: "Model mặc định (Auto = Task Classifier chọn):",
    preferLocal: "Ưu tiên model local (Ollama) làm fallback",
    costThreshold: "Ngưỡng chi phí (USD/request):",
    save: "Lưu cấu hình",
    saved: "Đã lưu",
    close: "Đóng",
    customModel: "Model Tùy chỉnh",
    customModelName: "Tên model (vd: gpt-4-turbo):",
    customProvider: "ID Provider (vd: openai):",
    customApiKey: "API Key cho model tùy chỉnh:",
    addCustom: "Thêm model tùy chỉnh",
    askAI: "Hỏi AI về workspace của bạn…",
    send: "Gửi",
    enterToSend: "Enter để gửi, Shift+Enter xuống dòng",
    slashHint: "Gõ / để dùng lệnh",
    modelUsed: "Model đã dùng",
    cost: "Chi phí",
    tokens: "Tokens",
    apply: "Áp dụng",
    online: "Trực tuyến",
    offline: "Ngoại tuyến",
    files: "file",
    changes: "thay đổi",
  },
};

export function useI18n() {
  const [lang, setLang] = React.useState<Lang>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Lang) || "vi";
    } catch {
      return "vi";
    }
  });

  const t = React.useCallback(
    (key: string) => dict[lang][key] || key,
    [lang]
  );

  const toggleLang = React.useCallback(() => {
    const next = lang === "vi" ? "en" : "vi";
    setLang(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, [lang]);

  return { lang, t, toggleLang };
}
