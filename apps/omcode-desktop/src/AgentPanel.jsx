import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  Plus,
  Paperclip,
  Check,
  GitCompareArrows,
  TerminalSquare,
  LoaderCircle,
} from "lucide-react";
import { api } from "./api";
import { Approval } from "./Approval";
export function AgentPanel({
  project,
  providers,
  skills,
  roles,
  sessions,
  onRefresh,
  currentFile,
  onError,
  onCommand,
  onFileChanged,
  canApply,
}) {
  const [providerId, setProviderId] = useState("");
  const [model, setModel] = useState("");
  const [role, setRole] = useState("coder");
  const [skill, setSkill] = useState("");
  const [prompt, setPrompt] = useState("");
  const [attach, setAttach] = useState(false);
  const [session, setSession] = useState(null);
  const [run, setRun] = useState(null);
  const [sending, setSending] = useState(false);
  const [approval, setApproval] = useState(null);
  const runRef = useRef(null);
  const scroll = useRef(null);
  const provider = providers.find((p) => p.id === providerId);
  const active = sending || !!approval || run?.status === "running";
  useEffect(() => {
    if (!providerId || !providers.some((p) => p.id === providerId)) {
      const first =
        providers.find((p) => p.generationStatus === "verified") ||
        providers.find((p) => p.status === "connected") ||
        providers[0];
      if (first) {
        setProviderId(first.id);
        setModel(first.model);
      }
    }
  }, [providers]);
  useEffect(() => {
    setSession(null);
    setRun(null);
    setApproval(null);
  }, [project?.root]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const state = await api("bootstrap");
        if (!state.activeRun) return;
        const current = await api(`session?id=${state.activeRun.sessionId}`);
        if (!cancelled && current.project === project?.root) {
          setSession(current);
          setRun(state.activeRun);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [project?.root]);
  useEffect(() => {
    scroll.current?.scrollTo({
      top: scroll.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.messages.length, run?.events?.length]);
  useEffect(() => {
    if (!run?.id || run.status !== "running") return;
    let stop = false;
    let timer;
    runRef.current = run.id;
    async function poll() {
      try {
        const result = await api(`agent/run?id=${run.id}`);
        if (stop) return;
        setRun(result);
        if (result.status !== "running") {
          setSession(await api(`session?id=${result.sessionId}`));
          onRefresh();
        } else timer = setTimeout(poll, 700);
      } catch (error) {
        if (!stop) {
          onError(error.message);
          setRun((current) => ({ ...current, status: "failed" }));
        }
      }
    }
    timer = setTimeout(poll, 500);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [run?.id, run?.status]);
  async function confirmSend() {
    setSending(true);
    try {
      const response = await api("agent/run", {
        approvalId: approval.id,
        digest: approval.digest,
      });
      setSession(await api(`session?id=${approval.sessionId}`));
      setRun({ id: response.id, status: "running", events: [] });
      setPrompt("");
      setAttach(false);
      setApproval(null);
    } catch (error) {
      onError(error.message);
      setApproval(null);
    } finally {
      setSending(false);
    }
  }
  const newSession = async () => {
    if (!project || active) return;
    try {
      const next = await api("sessions", { root: project.root });
      setSession(next);
      setRun(null);
      onRefresh();
    } catch (error) {
      onError(error.message);
    }
  };
  async function send(event) {
    event.preventDefault();
    if (!prompt.trim() || active || !project || !provider) return;
    setSending(true);
    try {
      const selected =
        session || (await api("sessions", { root: project.root }));
      setSession(selected);
      const response = await api("agent/prepare", {
        sessionId: selected.id,
        providerId,
        model,
        role,
        prompt,
        skillIds: skill ? [skill] : [],
        attachments:
          attach && currentFile
            ? [{ path: currentFile.path, content: currentFile.content }]
            : [],
      });
      setApproval(response);
    } catch (error) {
      onError(error.message);
    } finally {
      setSending(false);
    }
  }
  async function apply(proposal) {
    if (!canApply(proposal.path)) {
      onError(
        "Tệp đang mở có thay đổi chưa lưu. Lưu trước khi áp dụng đề xuất AI.",
      );
      return;
    }
    try {
      await api("proposal/apply", { sessionId: session.id, id: proposal.id });
      setSession(await api(`session?id=${session.id}`));
      onFileChanged(proposal.path);
    } catch (error) {
      onError(error.message);
    }
  }
  return (
    <aside className="agent-panel">
      {approval && (
        <Approval
          value={approval}
          onCancel={() => setApproval(null)}
          onConfirm={confirmSend}
          busy={sending}
        />
      )}
      <div className="panel-heading">
        <h2>Agent</h2>
        <button
          className="icon-button"
          aria-label="Phiên agent mới"
          title="Phiên mới"
          onClick={newSession}
          disabled={!project || active}
        >
          <Plus size={19} />
        </button>
      </div>
      <div className="provider-selectors">
        <label>
          Nhà cung cấp
          <select
            aria-label="Nhà cung cấp AI"
            disabled={active}
            value={providerId}
            onChange={(event) => {
              const p = providers.find((p) => p.id === event.target.value);
              setProviderId(p.id);
              setModel(p.model);
            }}
          >
            <option value="" disabled>
              Chưa kết nối
            </option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.status !== "connected" ? " · cần kiểm tra" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mô hình
          <select
            aria-label="Mô hình AI"
            disabled={active}
            value={model}
            onChange={(event) => setModel(event.target.value)}
          >
            {(provider?.models?.length
              ? provider.models
              : provider?.model
                ? [provider.model]
                : [""]
            ).map((item) => (
              <option key={item} value={item}>
                {item || "Chưa có model"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="role-tabs" role="tablist" aria-label="Vai trò agent">
        {roles.slice(0, 3).map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={role === item.id}
            className={role === item.id ? "active" : ""}
            onClick={() => setRole(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="session-picker">
        <select
          aria-label="Vai trò chuyên biệt"
          value={role}
          disabled={active}
          onChange={(event) => setRole(event.target.value)}
        >
          {roles.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Lịch sử phiên"
          disabled={active}
          value={session?.id || ""}
          onChange={async (event) => {
            if (!event.target.value) {
              setSession(null);
              setRun(null);
              return;
            }
            try {
              setSession(await api(`session?id=${event.target.value}`));
              setRun(null);
            } catch (error) {
              onError(error.message);
            }
          }}
        >
          <option value="">Phiên mới</option>
          {sessions
            .filter((s) => s.project === project?.root)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} · {new Date(s.updated).toLocaleString("vi-VN")}
              </option>
            ))}
        </select>
      </div>
      <div className="conversation" ref={scroll}>
        {session?.messages.length ? (
          session.messages.map((message, index) => (
            <article className={`message ${message.role}`} key={index}>
              <div className="message-author">
                {message.role === "user" ? "Bạn" : "OMCODE"}
                {message.model && <span>{message.model}</span>}
              </div>
              <div className="message-body">{message.content}</div>
              {message.billing && (
                <div className="receipt-meta">
                  {message.billing.receipt_id && (
                    <span title="Receipt ID">
                      receipt {message.billing.receipt_id}
                    </span>
                  )}
                  {message.billing.run_id && (
                    <span title="Run ID">run {message.billing.run_id}</span>
                  )}
                  {message.billing.ledger_entry_id && (
                    <span title="Ledger entry">
                      ledger {message.billing.ledger_entry_id}
                    </span>
                  )}
                  <span
                    className={
                      message.billing.verified ? "verified" : "unverified"
                    }
                  >
                    {message.billing.verified
                      ? "read-back đã xác minh"
                      : `billing chưa xác minh${message.billing.readback_error ? `: ${message.billing.readback_error}` : ""}`}
                  </span>
                  {message.billing.verified &&
                    message.billing.cost_usd !== null &&
                    message.billing.cost_usd !== undefined && (
                      <span>cost ${message.billing.cost_usd}</span>
                    )}
                </div>
              )}
              {message.proposals?.map((proposal) => (
                <details className="proposal" key={proposal.id}>
                  <summary>
                    {proposal.type === "edit" ? (
                      <GitCompareArrows size={15} />
                    ) : (
                      <TerminalSquare size={15} />
                    )}
                    <span>{proposal.path || proposal.command}</span>
                    {proposal.status === "applied" && <Check size={15} />}
                  </summary>
                  <p>{proposal.reason}</p>
                  {proposal.type === "edit" ? (
                    <>
                      <pre className="diff-before">
                        {proposal.before || "(tệp mới)"}
                      </pre>
                      <pre className="diff-after">{proposal.content}</pre>
                      <button
                        className="primary small"
                        disabled={proposal.status !== "pending"}
                        onClick={() => apply(proposal)}
                      >
                        {proposal.status === "applied"
                          ? "Đã áp dụng"
                          : "Áp dụng bản sửa"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="secondary small"
                      onClick={() => onCommand(proposal.command)}
                    >
                      Mở trong terminal
                    </button>
                  )}
                </details>
              ))}
            </article>
          ))
        ) : (
          <div className="agent-empty">
            <img src="/omcode-icon.png" alt="Omdala" />
            <h3>
              {providers.some((p) => p.generationStatus === "verified")
                ? "Sẵn sàng"
                : "Cần kiểm thử AI"}
            </h3>
            <span>{project?.name || "Chưa mở dự án"}</span>
          </div>
        )}
        {active && (
          <div className="agent-progress" role="status">
            <LoaderCircle className="spin" size={15} />
            <span>{run?.events?.at(-1)?.label || "Đang chuẩn bị..."}</span>
          </div>
        )}
        {run?.status === "failed" && (
          <p className="inline-error">{run.error}</p>
        )}
      </div>
      <form className="composer" onSubmit={send}>
        <textarea
          aria-label="Yêu cầu AI"
          placeholder="Nhập yêu cầu..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          disabled={!project || active}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey))
              send(event);
          }}
        />
        {attach && currentFile && (
          <div className="attachment">{currentFile.path}</div>
        )}
        <div className="composer-controls">
          <button
            type="button"
            className={`icon-button ${attach ? "pressed" : ""}`}
            aria-label="Đính kèm tệp đang mở"
            title="Đính kèm tệp đang mở"
            aria-pressed={attach}
            disabled={!currentFile}
            onClick={() => setAttach(!attach)}
          >
            <Paperclip size={17} />
          </button>
          <select
            aria-label="Chọn kỹ năng"
            value={skill}
            onChange={(event) => setSkill(event.target.value)}
          >
            <option value="">Chọn kỹ năng</option>
            {skills
              .filter((item) => item.reviewedDigest === item.digest)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          {active ? (
            <button
              type="button"
              className="send stop"
              aria-label="Dừng agent"
              title="Dừng agent"
              onClick={() =>
                api("agent/cancel", { id: run.id }).catch((error) =>
                  onError(error.message),
                )
              }
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              className="send"
              aria-label="Gửi yêu cầu AI"
              title="Gửi yêu cầu AI"
              disabled={!project || !provider || !prompt.trim()}
            >
              <ArrowUp size={20} />
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}
