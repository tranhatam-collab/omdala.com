import React, { useRef, useState } from "react";
import { Play, Square, X } from "lucide-react";
import { api } from "./api";
export function Terminal({ project, onClose, proposedCommand }) {
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("OMCODE local runtime ready.");
  const [running, setRunning] = useState(false);
  const control = useRef();
  React.useEffect(() => {
    if (proposedCommand) setCommand(proposedCommand);
  }, [proposedCommand]);
  async function run(event) {
    event.preventDefault();
    if (!command.trim() || !project || running) return;
    control.current = new AbortController();
    setRunning(true);
    setOutput((current) =>
      `${current}\n\n${project.name} % ${command}`.slice(-120000),
    );
    try {
      const result = await api(
        "terminal",
        { root: project.root, command },
        { signal: control.current.signal },
      );
      setOutput((current) =>
        `${current}\n${result.stdout}${result.stderr}\n[exit ${result.code ?? "signal"}${result.timedOut ? ", quá 60 giây" : ""}]`.slice(
          -120000,
        ),
      );
    } catch (error) {
      setOutput(
        (current) =>
          `${current}\n${error.name === "AbortError" ? "Đã dừng lệnh." : error.message}`,
      );
    } finally {
      setRunning(false);
    }
  }
  React.useEffect(() => () => control.current?.abort(), []);
  return (
    <section className="terminal">
      <div className="panel-heading">
        <strong>Terminal</strong>
        <div className="actions">
          {running && (
            <button
              aria-label="Dừng lệnh"
              title="Dừng lệnh"
              onClick={() => control.current?.abort()}
            >
              <Square size={15} />
            </button>
          )}
          <button
            aria-label="Đóng terminal"
            title="Đóng terminal"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <pre aria-live="polite" className="terminal-output">
        {output}
      </pre>
      <form className="terminal-command" onSubmit={run}>
        <span className="prompt">%</span>
        <input
          aria-label="Lệnh terminal"
          placeholder="Lệnh terminal"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          disabled={!project || running}
        />
        <button
          className="icon-button"
          title="Chạy lệnh"
          aria-label="Chạy lệnh"
          disabled={!project || running || !command.trim()}
        >
          <Play size={17} />
        </button>
      </form>
    </section>
  );
}
