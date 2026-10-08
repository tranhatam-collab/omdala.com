import React, { useEffect, useRef } from "react";
export function Approval({
  value,
  onConfirm,
  onCancel,
  busy = false,
  title = "Xác nhận gửi dữ liệu",
}) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
    return () => dialog.current?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="approval-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-label={title}
    >
      <h2>{title}</h2>
      <p>
        Đích chính xác:{" "}
        <code>{value.request?.destination || value.destination}</code>
      </p>
      <p>
        Chỉ gửi nội dung dưới đây. Model không được tự đọc repo hoặc tự gọi MCP.
        Hủy sẽ không gửi.
      </p>
      <pre aria-label="Payload sẽ gửi">
        {JSON.stringify(value.request?.body || value.request, null, 2)}
      </pre>
      <small>SHA-256: {value.digest}</small>
      <div className="form-actions">
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Hủy gửi
        </button>
        <button
          type="button"
          className="primary"
          onClick={onConfirm}
          disabled={busy}
        >
          Xác nhận đúng payload và đích
        </button>
      </div>
    </dialog>
  );
}
