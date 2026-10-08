// ─── useProjectType — Detect project type & logo from files ──────────────

export type ProjectType =
  | "react" | "nextjs" | "vue" | "angular" | "svelte"
  | "node" | "python" | "rust" | "go" | "java"
  | "flutter" | "swift" | "kotlin"
  | "docker" | "terraform" | "generic";

export interface ProjectMeta {
  type: ProjectType;
  icon: string;
  color: string;
  logoUrl?: string;
}

const TYPE_MAP: Record<string, ProjectType> = {
  "package.json": "node",
  "next.config.js": "nextjs",
  "next.config.mjs": "nextjs",
  "next.config.ts": "nextjs",
  "vite.config.js": "vue",
  "vite.config.ts": "vue",
  "angular.json": "angular",
  "svelte.config.js": "svelte",
  "Cargo.toml": "rust",
  "go.mod": "go",
  "pom.xml": "java",
  "build.gradle": "java",
  "requirements.txt": "python",
  "pyproject.toml": "python",
  "pubspec.yaml": "flutter",
  "Package.swift": "swift",
  "Dockerfile": "docker",
  "docker-compose.yml": "docker",
  "main.tf": "terraform",
};

const ICONS: Record<ProjectType, string> = {
  react: "⚛️", nextjs: "▲", vue: "🟢", angular: "🅰️", svelte: "🔥",
  node: "🟩", python: "🐍", rust: "🦀", go: "🐹", java: "☕",
  flutter: "🦋", swift: "🐦", kotlin: "🟣",
  docker: "🐳", terraform: "🏗️", generic: "📁",
};

const COLORS: Record<ProjectType, string> = {
  react: "#61dafb", nextjs: "#fff", vue: "#42b883", angular: "#dd0031",
  svelte: "#ff3e00", node: "#339933", python: "#3776ab", rust: "#dea584",
  go: "#00add8", java: "#007396", flutter: "#02569b", swift: "#ffac45",
  kotlin: "#7f52ff", docker: "#2496ed", terraform: "#844fba", generic: "#6b7f99",
};

export function detectProjectType(filePaths: string[]): ProjectMeta {
  for (const [file, type] of Object.entries(TYPE_MAP)) {
    if (filePaths.some((p) => p.includes(file))) {
      return { type, icon: ICONS[type], color: COLORS[type] };
    }
  }
  if (filePaths.some((p) => p.includes("src/App.tsx") || p.includes("src/App.jsx"))) return { type: "react", icon: ICONS.react, color: COLORS.react };
  if (filePaths.some((p) => p.includes("src/main.rs"))) return { type: "rust", icon: ICONS.rust, color: COLORS.rust };
  if (filePaths.some((p) => p.includes("main.py"))) return { type: "python", icon: ICONS.python, color: COLORS.python };
  return { type: "generic", icon: ICONS.generic, color: COLORS.generic };
}

export async function detectProjectLogo(
  rootHandle: FileSystemDirectoryHandle
): Promise<string | undefined> {
  try {
    // Try favicon, logo.svg, logo.png, icon.png
    const names = ["favicon.ico", "favicon.png", "logo.svg", "logo.png", "icon.png", "public/favicon.ico", "app/favicon.ico"];
    for (const name of names) {
      try {
        const fileHandle = await rootHandle.getFileHandle(name);
        const file = await fileHandle.getFile();
        if (file.size > 0) {
          return URL.createObjectURL(file);
        }
      } catch { continue; }
    }
  } catch {}
  return undefined;
}
