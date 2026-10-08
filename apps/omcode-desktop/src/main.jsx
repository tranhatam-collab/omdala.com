import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Files,
  GitBranch,
  Bot,
  BookOpen,
  Settings2,
  FolderOpen,
  Save,
  X,
  TerminalSquare,
  Moon,
  Sun,
  ChevronRight,
  RefreshCw,
  Menu,
  PanelRight,
  Check,
  FileCode2,
  History,
} from "lucide-react";
import { api, query } from "./api";
import { Explorer } from "./Explorer";
import { Terminal } from "./Terminal";
import { AgentPanel } from "./AgentPanel";
import { Settings, SkillLibrary } from "./Settings";
import "./styles.css";
const Editor = React.lazy(() =>
  import("./Editor").then((module) => ({ default: module.Editor })),
);

const initial = {
  projects: [],
  providers: [],
  skills: [],
  mcp: [],
  roles: [],
  sessions: [],
  settings: {},
};
function App() {
  const [data, setData] = useState(initial);
  const [project, setProject] = useState(null);
  const [file, setFile] = useState(null);
  const [original, setOriginal] = useState("");
  const [view, setView] = useState("files");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [terminal, setTerminal] = useState(true);
  const [proposedCommand, setProposedCommand] = useState("");
  const [dark, setDark] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("editor");
  const [explorerVisible, setExplorerVisible] = useState(false);
  const [pathDialog, setPathDialog] = useState(null);
  const [pathValue, setPathValue] = useState("");
  const [git, setGit] = useState(null);
  const [diff, setDiff] = useState("");
  const [edits, setEdits] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const dirty = !!file && (file.isNew || file.content !== original);
  const draftRef = useRef(null);
  const draftQueue = useRef(Promise.resolve());
  draftRef.current =
    dirty && project
      ? {
          root: project.root,
          path: file.path,
          content: file.content,
          baseHash: file.hash,
          isNew: !!file.isNew,
        }
      : null;
  function flushDraft() {
    const draft = draftRef.current;
    if (!draft) return draftQueue.current;
    const operation = draftQueue.current
      .catch(() => {})
      .then(() => api("draft", draft, { signal: AbortSignal.timeout(5000) }));
    draftQueue.current = operation;
    return operation;
  }
  useEffect(() => {
    window.omcodeFlushDraft = flushDraft;
    if (!dirty) return;
    const timer = setTimeout(
      () =>
        flushDraft().catch((error) =>
          setError(`Không lưu được bản nháp: ${error.message}`),
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [file, project?.root, dirty]);
  async function refresh() {
    const next = await api("bootstrap");
    setData(next);
    return next;
  }
  useEffect(() => {
    (async () => {
      try {
        const next = await refresh();
        setProject(next.projects[0] || null);
        setDark(next.settings.theme === "dark");
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const before = (event) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  async function canLeave() {
    if (saving) return false;
    try {
      await flushDraft();
      return (
        !dirty ||
        window.confirm("Bản nháp đã được giữ lại. Rời tệp chưa lưu này?")
      );
    } catch (error) {
      setError(`Không lưu được bản nháp: ${error.message}`);
      return false;
    }
  }
  async function openProject(path) {
    if (!(await canLeave())) return;
    try {
      const selected = await api("project/open", { path });
      setProject(selected);
      setFile(null);
      setOriginal("");
      setPathDialog(null);
      setView("files");
      setExplorerVisible(false);
      await refresh();
    } catch (error) {
      setError(error.message);
    }
  }
  function chooseProject() {
    if (window.webkit?.messageHandlers?.chooseProject)
      window.webkit.messageHandlers.chooseProject.postMessage({});
    else {
      setPathValue(project?.root || "");
      setPathDialog("project");
    }
  }
  useEffect(() => {
    const handler = (event) => openProject(event.detail.path);
    window.addEventListener("omcode:project", handler);
    return () => window.removeEventListener("omcode:project", handler);
  }, [dirty, project?.root]);
  async function openFile(path, force = false) {
    if (!force && !(await canLeave())) return;
    try {
      await flushDraft();
      const result = await api(`file?${query({ root: project.root, path })}`);
      setFile({
        path,
        ...result,
        ...(result.draft
          ? { content: result.draft.content, hash: result.draft.baseHash }
          : {}),
      });
      setOriginal(result.content);
      if (result.draft) {
        if (result.draft.baseHash !== result.hash)
          setError(
            "Đã mở bản nháp. Tệp trên đĩa có thay đổi mới; chốt nội dung trước khi ghi đè.",
          );
        else setNotice("Đã khôi phục bản nháp");
      }
      setMobilePanel("editor");
      setExplorerVisible(false);
    } catch (error) {
      setError(error.message);
    }
  }
  async function saveFile() {
    if (!file || saving || !dirty) return;
    setSaving(true);
    try {
      await flushDraft();
      const result = await api("file", {
        root: project.root,
        path: file.path,
        content: file.content,
        expectedHash: file.hash,
      });
      setFile((current) => ({ ...current, hash: result.hash, isNew: false }));
      setOriginal(file.content);
      setNotice("Đã lưu tệp và bản khôi phục");
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        saveFile();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "o") {
        event.preventDefault();
        chooseProject();
      }
      if (event.key === "Escape") setPathDialog(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [file, original, saving]);
  useEffect(() => {
    if (view === "git" && project)
      api(`git?${query({ root: project.root })}`)
        .then(setGit)
        .catch((error) => setError(error.message));
    if (view === "history" && project)
      flushDraft()
        .then(async () => {
          setEdits(await api(`edits?${query({ root: project.root })}`));
          setDrafts(await api(`drafts?${query({ root: project.root })}`));
        })
        .catch((error) => setError(error.message));
  }, [view, project?.root]);
  const navigation = [
    { id: "files", icon: Files, label: "Tệp" },
    { id: "git", icon: GitBranch, label: "Git" },
    { id: "agents", icon: Bot, label: "Agents" },
    { id: "skills", icon: BookOpen, label: "Kỹ năng" },
    { id: "history", icon: History, label: "Bản lưu" },
    { id: "settings", icon: Settings2, label: "Kết nối" },
  ];
  if (loading)
    return (
      <div className="boot">
        <img src="/omcode-icon.png" alt="Omdala" />
        <h1>OMCODE</h1>
        <span>Đang mở workspace...</span>
      </div>
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src="/omcode-icon.png" alt="" />
          <strong>OMCODE</strong>
        </div>
        <button className="secondary open-project" onClick={chooseProject}>
          <FolderOpen size={17} />
          <span>Mở dự án</span>
        </button>
        <div className="project-name" title={project?.root}>
          {project?.name || "Workspace local"}
        </div>
        <div className="actions">
          <button
            title="Kết nối"
            aria-label="Mở cài đặt kết nối"
            onClick={() => setView("settings")}
          >
            <Settings2 size={19} />
          </button>
          <button
            title={dark ? "Giao diện sáng" : "Giao diện tối"}
            aria-label="Đổi giao diện"
            onClick={() => {
              setDark(!dark);
              api("preferences", { theme: !dark ? "dark" : "light" }).catch(
                (error) => setError(error.message),
              );
            }}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button aria-label="Đóng thông báo lỗi" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="app-body">
        <nav className="activity-rail" aria-label="Điều hướng">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              title={item.label}
              aria-label={item.label}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => setView(item.id)}
            >
              <item.icon size={23} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <main className="main-content">
          {view === "files" ? (
            <>
              <div className="mobile-toolbar">
                <button
                  className="icon-button"
                  aria-label="Hiện cây tệp"
                  onClick={() => setExplorerVisible(!explorerVisible)}
                >
                  <Menu size={18} />
                </button>
                <button
                  className={mobilePanel === "editor" ? "active" : ""}
                  onClick={() => setMobilePanel("editor")}
                >
                  Trình soạn thảo
                </button>
                <button
                  className={mobilePanel === "agent" ? "active" : ""}
                  onClick={() => setMobilePanel("agent")}
                >
                  Agent
                </button>
              </div>
              <div
                className={`workbench mobile-${mobilePanel} ${explorerVisible ? "show-explorer" : ""}`}
              >
                <Explorer
                  project={project}
                  selected={file?.path}
                  onFile={openFile}
                  onError={setError}
                  onCreate={() => {
                    setPathValue("");
                    setPathDialog("file");
                  }}
                />
                <section className="editor-column">
                  <div className="editor-tabs">
                    <div className="file-tab">
                      <FileCode2 size={16} />
                      <span title={file?.path}>
                        {file?.path.split("/").at(-1) || "Workspace"}
                      </span>
                      {dirty && (
                        <span className="dirty-dot" aria-label="Chưa lưu" />
                      )}
                    </div>
                    <div className="actions">
                      <button
                        aria-label="Lưu tệp"
                        title="Lưu tệp"
                        onClick={saveFile}
                        disabled={!dirty || saving}
                      >
                        <Save size={17} />
                      </button>
                      <button
                        aria-label="Bật terminal"
                        title="Terminal"
                        onClick={() => setTerminal(!terminal)}
                      >
                        <TerminalSquare size={17} />
                      </button>
                      {file && (
                        <button
                          title="Đóng tệp"
                          aria-label="Đóng tệp"
                          onClick={async () => {
                            if (await canLeave()) setFile(null);
                          }}
                        >
                          <X size={17} />
                        </button>
                      )}
                    </div>
                  </div>
                  {file ? (
                    <>
                      <div className="breadcrumbs">
                        <span>{project.name}</span>
                        <ChevronRight size={13} />
                        <span>{file.path}</span>
                      </div>
                      <React.Suspense
                        fallback={<div className="code-editor" />}
                      >
                        <Editor
                          key={file.path}
                          label={`Soạn thảo ${file.path}`}
                          content={file.content}
                          onChange={(content) =>
                            setFile((current) => ({ ...current, content }))
                          }
                          dark={dark}
                        />
                      </React.Suspense>
                    </>
                  ) : (
                    <div className="workspace-empty">
                      <img src="/omcode-icon.png" alt="Omdala" />
                      <h1>OMCODE</h1>
                      <p>{project ? project.name : "Workspace local"}</p>
                      {project ? (
                        <div className="recent-files">
                          <button
                            className="secondary"
                            onClick={() => openFile("README.md")}
                          >
                            <FileCode2 size={16} />
                            README.md
                          </button>
                          <button
                            className="secondary"
                            onClick={() => openFile("package.json")}
                          >
                            <FileCode2 size={16} />
                            package.json
                          </button>
                        </div>
                      ) : (
                        <button className="primary" onClick={chooseProject}>
                          <FolderOpen size={17} />
                          Mở dự án
                        </button>
                      )}
                      {data.projects.length > 1 && (
                        <div className="recent-projects">
                          {data.projects.slice(1, 5).map((item) => (
                            <button
                              key={item.root}
                              onClick={() => openProject(item.root)}
                            >
                              <FolderOpen size={16} />
                              <span>{item.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {terminal && (
                    <Terminal
                      key={project?.root}
                      project={project}
                      onClose={() => setTerminal(false)}
                      proposedCommand={proposedCommand}
                    />
                  )}
                </section>
                <AgentPanel
                  project={project}
                  providers={data.providers}
                  skills={data.skills}
                  roles={data.roles}
                  sessions={data.sessions}
                  onRefresh={() =>
                    refresh().catch((error) => setError(error.message))
                  }
                  currentFile={file}
                  onError={setError}
                  canApply={(path) => !(file?.path === path && dirty)}
                  onCommand={(command) => {
                    setProposedCommand(command);
                    setTerminal(true);
                    setMobilePanel("editor");
                  }}
                  onFileChanged={(path) => {
                    setNotice("Đã áp dụng bản sửa");
                    if (file?.path === path) openFile(path, true);
                  }}
                />
              </div>
            </>
          ) : view === "settings" ? (
            <Settings data={data} refresh={refresh} onError={setError} />
          ) : view === "skills" ? (
            <SkillLibrary
              skills={data.skills}
              refresh={refresh}
              onError={setError}
            />
          ) : view === "agents" ? (
            <section className="settings-view">
              <header className="view-heading">
                <div>
                  <h1>Agents</h1>
                  <p>
                    {
                      data.providers.filter((p) => p.status === "connected")
                        .length
                    }{" "}
                    kết nối AI · 1 tác vụ đồng thời
                  </p>
                </div>
              </header>
              <div className="role-list">
                {data.roles.map((item) => (
                  <div className="role-row" key={item.id}>
                    <Bot size={22} />
                    <strong>{item.name}</strong>
                    <span>{item.id}</span>
                  </div>
                ))}
              </div>
              <button
                className="primary"
                onClick={() => {
                  setView("files");
                  setMobilePanel("agent");
                }}
              >
                Mở workspace
              </button>
            </section>
          ) : view === "git" ? (
            <section className="settings-view">
              <header className="view-heading">
                <div>
                  <h1>Source control</h1>
                  <p>{git?.branch || project?.name || "Chưa mở dự án"}</p>
                </div>
                <button
                  className="icon-button"
                  title="Làm mới Git"
                  aria-label="Làm mới Git"
                  onClick={() =>
                    project &&
                    api(`git?${query({ root: project.root })}`)
                      .then(setGit)
                      .catch((error) => setError(error.message))
                  }
                >
                  <RefreshCw size={18} />
                </button>
              </header>
              {git?.error && <p className="inline-error">{git.error}</p>}
              {git?.available && !git.files.length && (
                <p className="muted">Không có thay đổi</p>
              )}
              <div className="git-list">
                {git?.files.map((item) => (
                  <button
                    key={item.path}
                    onClick={() =>
                      api(
                        `git/diff?${query({ root: project.root, path: item.path })}`,
                      )
                        .then((result) =>
                          setDiff(
                            result.stdout || "Tệp mới chưa được Git theo dõi.",
                          ),
                        )
                        .catch((error) => setError(error.message))
                    }
                  >
                    <code>{item.status}</code>
                    <span>{item.path}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
              </div>
              {diff && <pre className="diff-output">{diff}</pre>}
            </section>
          ) : (
            <section className="settings-view">
              <header className="view-heading">
                <div>
                  <h1>Bản lưu tệp</h1>
                  <p>{project?.name || "Chưa mở dự án"}</p>
                </div>
              </header>
              {drafts.map((draft) => (
                <div className="provider-row" key={`draft-${draft.path}`}>
                  <FileCode2 size={18} />
                  <div className="provider-detail">
                    <strong>{draft.path}</strong>
                    <span>
                      Bản nháp chưa lưu ·{" "}
                      {new Date(draft.updated).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <button
                    className="secondary small"
                    onClick={async () => {
                      await openFile(draft.path);
                      setView("files");
                    }}
                  >
                    Mở bản nháp
                  </button>
                </div>
              ))}
              {edits.length ? (
                edits.map((edit) => (
                  <div className="provider-row" key={edit.id}>
                    <History size={18} />
                    <div className="provider-detail">
                      <strong>{edit.path}</strong>
                      <span>
                        {new Date(edit.created).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <button
                      className="secondary small"
                      onClick={async () => {
                        if (!confirm(`Khôi phục bản trước của ${edit.path}?`))
                          return;
                        try {
                          await api("edit/restore", { id: edit.id });
                          setNotice("Đã khôi phục tệp");
                          if (file?.path === edit.path)
                            openFile(edit.path, true);
                        } catch (error) {
                          setError(error.message);
                        }
                      }}
                    >
                      Khôi phục
                    </button>
                  </div>
                ))
              ) : (
                <p className="muted">Chưa có bản lưu</p>
              )}
            </section>
          )}
        </main>
      </div>
      <footer className="statusbar">
        <span>
          <i />
          Local
        </span>
        <span>
          <GitBranch size={13} />
          {git?.branch || project?.name || "OMCODE"}
        </span>
        <div className="status-right">
          <span>
            {notice && (
              <>
                <Check size={13} />
                {notice}
              </>
            )}
          </span>
          <span>UTF-8</span>
          <span>
            {file?.path.split(".").at(-1)?.toUpperCase() ||
              data.version ||
              "OMCODE"}
          </span>
        </div>
      </footer>
      {pathDialog && (
        <div className="modal-backdrop" onClick={() => setPathDialog(null)}>
          <form
            role="dialog"
            aria-modal="true"
            aria-label={pathDialog === "project" ? "Mở dự án local" : "Tạo tệp"}
            className="path-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={async (event) => {
              event.preventDefault();
              if (pathDialog === "project") await openProject(pathValue);
              else {
                if (!(await canLeave())) return;
                const emptyHash =
                  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
                setFile({
                  path: pathValue,
                  content: "",
                  hash: emptyHash,
                  isNew: true,
                });
                setOriginal("");
                setPathDialog(null);
              }
            }}
          >
            <h2>{pathDialog === "project" ? "Mở dự án local" : "Tệp mới"}</h2>
            <label>
              {pathDialog === "project"
                ? "Đường dẫn thư mục"
                : "Đường dẫn trong dự án"}
              <input
                autoFocus
                required
                value={pathValue}
                onChange={(event) => setPathValue(event.target.value)}
              />
            </label>
            <div className="form-actions">
              <button
                className="secondary"
                type="button"
                onClick={() => setPathDialog(null)}
              >
                Hủy
              </button>
              <button className="primary">
                {pathDialog === "project" ? "Mở dự án" : "Tạo tệp"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="boot">
        <h1>OMCODE</h1>
        <p>Giao diện gặp lỗi. Dữ liệu đã lưu vẫn được giữ.</p>
        <pre>{String(this.state.error.message)}</pre>
        <button onClick={() => location.reload()}>Mở lại</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
