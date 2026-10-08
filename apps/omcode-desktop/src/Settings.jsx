import React, { useState } from "react";
import {
  RefreshCw,
  Download,
  Plus,
  CheckCircle2,
  AlertCircle,
  PlugZap,
  Play,
} from "lucide-react";
import { api } from "./api";
import { Approval } from "./Approval";
import { aiagentConnectionForm } from "./provider-presets.mjs";
export function Settings({ data, refresh, onError }) {
  const [busy, setBusy] = useState("");
  const [form, setForm] = useState(null);
  const [tool, setTool] = useState(null);
  const [args, setArgs] = useState("{}");
  const [result, setResult] = useState("");
  const [approval, setApproval] = useState(null);
  const [embed, setEmbed] = useState(null);
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
      {approval && (
        <Approval
          value={approval}
          onCancel={() => setApproval(null)}
          busy={!!busy}
          onConfirm={() =>
            action("confirmed", async () => {
              const answer = await api(approval.action, {
                approvalId: approval.id,
                digest: approval.digest,
              });
              setResult(JSON.stringify(answer, null, 2));
              setApproval(null);
            })
          }
        />
      )}
      <header className="view-heading">
        <div>
          <h1>Kết nối AI & Tools</h1>
          <p>OMCODE local</p>
        </div>
      </header>
      <div className="section-title">
        <h2>Nhà cung cấp AI</h2>
        <button
          className="secondary small"
          onClick={() =>
            setForm(aiagentConnectionForm(data.providers, "production"))
          }
        >
          Kết nối AIAGENT
        </button>
        <button
          className="secondary small"
          onClick={() =>
            setForm(aiagentConnectionForm(data.providers, "staging"))
          }
        >
          Kết nối AIAGENT staging
        </button>
        <button
          className="icon-button"
          aria-label="Thêm provider"
          title="Thêm provider"
          onClick={() =>
            setForm({ name: "", baseUrl: "", model: "", kind: "local" })
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
              {!!provider.embeddingModels?.length && (
                <button
                  className="secondary small"
                  onClick={() =>
                    setEmbed({
                      id: provider.id,
                      models: provider.embeddingModels,
                      model: provider.embeddingModels[0],
                      input: "",
                    })
                  }
                >
                  {provider.embeddingModels.length} model embedding
                </button>
              )}
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
              onClick={() => setForm({ ...provider })}
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
      {embed && (
        <form
          className="provider-form"
          onSubmit={(e) => {
            e.preventDefault();
            action("embed-preview", async () =>
              setApproval({
                ...(await api("embedding/prepare", embed)),
                action: "embedding/run",
              }),
            );
          }}
        >
          <h3>Embedding AIAGENT</h3>
          <select
            aria-label="Model embedding"
            value={embed.model}
            onChange={(e) => setEmbed({ ...embed, model: e.target.value })}
          >
            {embed.models.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
          <textarea
            aria-label="Văn bản embedding"
            value={embed.input}
            onChange={(e) => setEmbed({ ...embed, input: e.target.value })}
            maxLength={20000}
            required
          />
          <button className="primary" disabled={!!busy}>
            Xem payload embedding
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setEmbed(null)}
          >
            Đóng embedding
          </button>
        </form>
      )}
      {result && !tool && <pre className="tool-form">{result}</pre>}
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
              readOnly={form.id === "aiagent" || form.id === "aiagent-staging"}
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
          {form.kind === "iai-one" && (
            <p>
              Tài khoản Keychain native: <code>{form.id}</code>. Credential,
              tenant và workspace không đi qua trình duyệt; backend lấy identity
              từ deployment và credential đã được cấp quyền.
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setForm(null)}
            >
              Hủy
            </button>
            <button className="primary" disabled={!!busy}>
              Lưu cấu hình
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
                      {"Luôn cần xác nhận; annotation không phải quyền"}
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
                  const answer = await api("mcp/prepare", {
                    id: tool.server.id,
                    name: tool.name,
                    arguments: JSON.parse(args),
                  });
                  setApproval({ ...answer, action: "mcp/call" });
                })
              }
            >
              Xem và duyệt tool
            </button>
          </div>
          {result && <pre>{result}</pre>}
        </div>
      )}
      <div className="data-location">
        <h2>Dữ liệu local</h2>
        <code>{data.dataDirectory}</code>
        <p>
          Dữ liệu lưu local dạng plaintext với quyền thư mục 0700, tệp 0600.
          Không tự xóa lịch sử. Provider credential chỉ tồn tại trong native
          Keychain và không đi qua UI.
        </p>
        <button
          className="secondary"
          onClick={() =>
            action("export", async () => {
              const data = await api("data/export");
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = "omcode-private-history.json";
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 10000);
            })
          }
        >
          Xuất lịch sử và bản nháp
        </button>
        <button
          className="secondary"
          onClick={() =>
            action("prepare-clear", async () =>
              setApproval({
                ...(await api("data/prepare-clear", {})),
                action: "data/clear",
              }),
            )
          }
        >
          Xem và duyệt xóa lịch sử local
        </button>
        <p>
          Xóa lịch sử không xóa tệp dự án, Keychain hoặc các bản backup đã xuất.
          Không bảo đảm xóa vật lý trên SSD.
        </p>
      </div>
    </section>
  );
}
export function SkillLibrary({ skills, refresh, onError }) {
  const [review, setReview] = useState(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = skills.filter((item) =>
    `${item.name} ${item.description}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  return (
    <section className="settings-view">
      {review && (
        <Approval
          title="Duyệt skill prompt-only"
          value={review}
          onCancel={() => setReview(null)}
          onConfirm={async () => {
            try {
              await api("skill/approve", {
                approvalId: review.id,
                digest: review.digest,
              });
              setReview(null);
              await refresh();
            } catch (e) {
              onError(e.message);
              setReview(null);
            }
          }}
        />
      )}
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
            <p>
              {item.reviewedDigest === item.digest
                ? "Đã duyệt tree; chỉ dùng prompt, không chạy script"
                : "Cách ly: chưa được dùng trong ngữ cảnh AI"}
            </p>
            <button
              className="secondary small"
              onClick={async () => {
                try {
                  setReview(await api("skill/review", { id: item.id }));
                } catch (e) {
                  onError(e.message);
                }
              }}
            >
              Xem và duyệt skill
            </button>
          </details>
        ))}
      </div>
    </section>
  );
}
