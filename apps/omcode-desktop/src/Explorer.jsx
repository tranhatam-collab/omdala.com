import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  FolderOpen,
  Search,
  RefreshCw,
  FilePlus2,
} from "lucide-react";
import { api, query } from "./api";
export function Explorer({ project, selected, onFile, onCreate, onError }) {
  const [entries, setEntries] = useState({});
  const [opened, setOpened] = useState(new Set([""]));
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async (directory) => {
    try {
      setLoading(true);
      const data = await api(
        `files?${query({ root: project.root, path: directory })}`,
      );
      setEntries((current) => ({ ...current, [directory]: data.entries }));
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setEntries({});
    setOpened(new Set([""]));
    if (project) load("");
  }, [project?.root]);
  const toggle = (item) => {
    const next = new Set(opened);
    if (next.has(item.path)) next.delete(item.path);
    else {
      next.add(item.path);
      if (!entries[item.path]) load(item.path);
    }
    setOpened(next);
  };
  function tree(directory, depth = 0) {
    return (entries[directory] || [])
      .filter(
        (item) =>
          !filter ||
          item.directory ||
          item.name.toLowerCase().includes(filter.toLowerCase()),
      )
      .map((item) => (
        <React.Fragment key={item.path}>
          <button
            className={`file-row ${selected === item.path ? "selected" : ""}`}
            style={{ paddingLeft: 12 + depth * 16 }}
            title={item.path}
            onClick={() => (item.directory ? toggle(item) : onFile(item.path))}
          >
            {item.directory ? (
              opened.has(item.path) ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )
            ) : (
              <span className="tree-spacer" />
            )}
            {item.directory ? (
              <Folder size={15} />
            ) : (
              <FileCode2 className="file-icon" size={15} />
            )}
            <span>{item.name}</span>
          </button>
          {item.directory &&
            opened.has(item.path) &&
            tree(item.path, depth + 1)}
        </React.Fragment>
      ));
  }
  return (
    <aside className="explorer">
      <div className="panel-heading">
        <strong>TỆP DỰ ÁN</strong>
        <div className="actions">
          <button
            aria-label="Tệp mới"
            title="Tệp mới"
            onClick={onCreate}
            disabled={!project}
          >
            <FilePlus2 size={16} />
          </button>
          <button
            aria-label="Làm mới cây tệp"
            title="Làm mới"
            onClick={() => load("")}
            disabled={!project || loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} />
          </button>
        </div>
      </div>
      <label className="search-field">
        <Search size={15} />
        <input
          aria-label="Tìm tệp"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Tìm tệp..."
        />
      </label>
      <div className="file-tree">
        {project ? (
          <>
            <div className="root-row">
              <ChevronDown size={14} />
              <FolderOpen size={16} />
              <strong title={project.root}>{project.name}</strong>
            </div>
            {tree("")}
          </>
        ) : (
          <p className="muted empty-small">Chưa mở dự án</p>
        )}
      </div>
    </aside>
  );
}
