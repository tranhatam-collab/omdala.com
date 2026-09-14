import React, { useState } from "react";
import {
  RefreshCw,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  PlugZap,
  KeyRound,
  Play,
} from "lucide-react";
import { api } from "./api";
export function Settings({ data, refresh, onError }) {
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState(null);
  const [tool, setTool] = useState(null);
  const [args, setArgs] = useState("{}");
  const [result, setResult] = useState("");
  async function action(id, run) {
    setBusy(id);
    try {
      await run();
      await refresh();
    } catch (error) {
      onError(error.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="settings-view">
      <header className="view-heading">
        <div>
          <h1>Kết nối AI & Tools</h1>
          <p>OMCODE local</p>
        </div>
        <button
          className="secondary"
          onClick={() => action("import", () => api("import/providers", {}))}
          disabled={!!busy}
        >
          <Download size={16} />
          Nhập API từ hệ thống
        </button>
      </header>
      <div className="section-title">
        <h2>Nhà cung cấp AI</h2>
        <button
          className="icon-button"
          aria-label="Thêm provider"
          title="Thêm provider"
          onClick={() =>
            setForm({ name: "", baseUrl: "", model: "", apiKey: "" })
          }
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="provider-list">
        {data.providers.map((provider) => (
          <div className="provider-row" key={provider.id}>
            <div className={`provider-symbol ${provider.status}`}>
              <PlugZap size={20} />
            </div>
            <div className="provider-detail">
              <strong>{provider.name}</strong>
              <span>{provider.baseUrl}</span>
              <small
                className={provider.status === "error" ? "error-text" : ""}
              >
                {provider.error ||
                  (provider.status === "connected"
                    ? `${provider.models.length} model · Đã kết nối`
                    : "Chưa kiểm tra")}
              </small>
              {provider.generationStatus && (
                <small
                  className={
                    provider.generationStatus === "failed" ? "error-text" : ""
                  }
                >
                  {provider.generationStatus === "verified"
                    ? `AI đã kiểm chứng · ${provider.model}`
                    : provider.generationError}
                </small>
              )}
            </div>
            <button
              className="secondary small"
              onClick={() => setForm({ ...provider, apiKey: "" })}
            >
              Chỉnh sửa
            </button>
            <button
              className="icon-button"
              aria-label={`Kiểm thử AI ${provider.name}`}
              title="Kiểm thử phản hồi AI"
              disabled={!!busy}
              onClick={() =>
                action(`probe-${provider.id}`, () =>
                  api("provider/probe", { id: provider.id }),
                )
              }
            >
              <Play size={16} />
            </button>
            <button
              className="icon-button"
              aria-label={`Kiểm tra ${provider.name}`}
              title="Kiểm tra kết nối"
              disabled={!!busy}
              onClick={() =>
                action(provider.id, () =>
                  api("provider/check", { id: provider.id }),
                )
              }
            >
              <RefreshCw
                size={17}
                className={busy === provider.id ? "spin" : ""}
              />
            </button>
          </div>
        ))}
      </div>
      {form && (
        <form
          className="provider-form"
          onSubmit={(event) => {
            event.preventDefault();
            action("save", async () => {
              await api("provider", form);
              setForm(null);
            });
          }}
        >
          <label>
            Tên
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <label>
            API base URL
            <input
              type="url"
              required
              value={form.baseUrl}
              onChange={(event) =>
                setForm({ ...form, baseUrl: event.target.value })
              }
              placeholder="https://.../v1"
            />
          </label>
          <label>
            Model
            <input
              value={form.model}
              onChange={(event) =>
                setForm({ ...form, model: event.target.value })
              }
            />
          </label>
          <label>
            API key
            <KeyRound size={14} />
            <input
              type="password"
              autoComplete="off"
              value={form.apiKey}
              onChange={(event) =>
                setForm({ ...form, apiKey: event.target.value })
              }
              placeholder={form.id ? "Giữ khóa hiện tại" : ""}
            />
          </label>
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setForm(null)}
            >
              Hủy
            </button>
            <button className="primary" disabled={!!busy}>
              Lưu vào Keychain
            </button>
          </div>
        </form>
      )}
      <div className="section-title">
        <h2>MCP</h2>
        <button
          className="secondary small"
          disabled={!!busy}
          onClick={() => action("mcp-import", () => api("import/mcp", {}))}
        >
          <Download size={15} />
          Nhập cấu hình
        </button>
      </div>
      <div className="provider-list">
        {data.mcp.map((server) => (
          <div className="mcp-row" key={server.id}>
            <div className="provider-row">
              <div className="provider-symbol">
                {server.status === "connected" ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>
              <div className="provider-detail">
                <strong>{server.id}</strong>
                <span>{server.url}</span>
                <small>
                  {server.error ||
                    (server.status === "connected"
                      ? `${server.tools.length} tool`
                      : "Chưa kiểm tra quyền kết nối")}
                </small>
              </div>
              <button
                className="icon-button"
                aria-label={`Kiểm tra MCP ${server.id}`}
                title="Kiểm tra MCP"
                disabled={!!busy}
                onClick={() =>
                  action(server.id, () => api("mcp/check", { id: server.id }))
                }
              >
                <RefreshCw
                  size={17}
                  className={busy === server.id ? "spin" : ""}
                />
              </button>
            </div>
            {server.tools?.length > 0 && (
              <div className="mcp-tools">
                {server.tools.map((item) => (
                  <button
                    key={item.name}
                    className="tool-row"
                    onClick={() => {
                      setTool({ server, ...item });
                      setResult("");
                      setArgs("{}");
                    }}
                  >
                    <span>{item.name}</span>
                    <small>
                      {item.readOnly ? "Read-only" : "Cần xem xét quyền ghi"}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {tool && (
        <div className="tool-form">
          <h3>{tool.name}</h3>
          <p>{tool.description}</p>
          <details>
            <summary>Schema</summary>
            <pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
          </details>
          <textarea
            aria-label="Tham số MCP JSON"
            value={args}
            onChange={(event) => setArgs(event.target.value)}
            rows={6}
          />
          <div className="form-actions">
            <button className="secondary" onClick={() => setTool(null)}>
              Đóng
            </button>
            <button
              className="primary"
              disabled={!!busy}
              onClick={() =>
                action("mcp-tool", async () => {
                  const answer = await api("mcp/call", {
                    id: tool.server.id,
                    name: tool.name,
                    arguments: JSON.parse(args),
                  });
                  setResult(JSON.stringify(answer, null, 2));
                })
              }
            >
              Chạy tool
            </button>
          </div>
          {result && <pre>{result}</pre>}
        </div>
      )}
      <div className="data-location">
        <h2>Dữ liệu local</h2>
        <code>{data.dataDirectory}</code>
        <p>Phiên làm việc, bản lưu tệp và thư viện kỹ năng</p>
      </div>
    </section>
  );
}
export function SkillLibrary({ skills, refresh, onError }) {
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = skills.filter((item) =>
    `${item.name} ${item.description}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  return (
    <section className="settings-view">
      <header className="view-heading">
        <div>
          <h1>Thư viện kỹ năng</h1>
          <p>{skills.length} kỹ năng local</p>
        </div>
        <button
          className="secondary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await api("import/skills", {});
              await refresh();
            } catch (error) {
              onError(error.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={16} className={busy ? "spin" : ""} />
          Đồng bộ từ hệ thống
        </button>
      </header>
      <input
        className="library-search"
        aria-label="Tìm kỹ năng"
        placeholder="Tìm kỹ năng..."
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      />
      <div className="skill-list">
        {filtered.map((item) => (
          <details className="skill-row" key={item.id}>
            <summary>
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </summary>
            <dl>
              <dt>Nguồn</dt>
              <dd>{item.source}</dd>
              <dt>Bản local</dt>
              <dd>{item.path}</dd>
              <dt>SHA-256</dt>
              <dd>{item.digest}</dd>
            </dl>
          </details>
        ))}
      </div>
    </section>
  );
}
