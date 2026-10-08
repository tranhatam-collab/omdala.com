import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

export function createStore(directory) {
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  fs.chmodSync(directory, 0o700);
  const db = new DatabaseSync(path.join(directory, "omcode.sqlite"));
  fs.chmodSync(path.join(directory, "omcode.sqlite"), 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, title TEXT NOT NULL, project TEXT NOT NULL, updated INTEGER NOT NULL, messages TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS edits (id TEXT PRIMARY KEY, project TEXT NOT NULL, path TEXT NOT NULL, before TEXT NOT NULL, after TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS drafts (project TEXT NOT NULL, path TEXT NOT NULL, content TEXT NOT NULL, baseHash TEXT NOT NULL, isNew INTEGER NOT NULL, dirty INTEGER NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(project,path));`);
  if (
    !db
      .prepare("PRAGMA table_info(edits)")
      .all()
      .some((c) => c.name === "state")
  )
    db.exec(
      "ALTER TABLE edits ADD COLUMN state TEXT NOT NULL DEFAULT 'legacy_unverified'",
    );
  db.exec(
    "UPDATE edits SET state='interrupted' WHERE state='pending'; PRAGMA secure_delete=ON;",
  );
  for (const suffix of ["-wal", "-shm"]) {
    try {
      fs.chmodSync(path.join(directory, "omcode.sqlite" + suffix), 0o600);
    } catch {}
  }
  return {
    directory,
    exportData() {
      return {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        sessions: db
          .prepare("SELECT * FROM sessions")
          .all()
          .map((s) => ({ ...s, messages: JSON.parse(s.messages) })),
        edits: db.prepare("SELECT * FROM edits").all(),
        drafts: db.prepare("SELECT * FROM drafts").all(),
      };
    },
    clearData() {
      db.exec(
        "BEGIN; DELETE FROM sessions; DELETE FROM edits; DELETE FROM drafts; COMMIT; PRAGMA wal_checkpoint(TRUNCATE);",
      );
    },
    finishEdit(id, state) {
      if (!["committed", "failed"].includes(state))
        throw new Error("Invalid edit state");
      db.prepare("UPDATE edits SET state=? WHERE id=? AND state='pending'").run(
        state,
        id,
      );
    },
    get(key, fallback) {
      const r = db.prepare("SELECT value FROM settings WHERE key=?").get(key);
      return r ? JSON.parse(r.value) : fallback;
    },
    set(key, value) {
      db.prepare("INSERT OR REPLACE INTO settings VALUES (?, ?)").run(
        key,
        JSON.stringify(value),
      );
      return value;
    },
    sessions() {
      return db
        .prepare(
          "SELECT id,title,project,updated FROM sessions ORDER BY updated DESC LIMIT 300",
        )
        .all();
    },
    session(id) {
      const s = db.prepare("SELECT * FROM sessions WHERE id=?").get(id);
      return s ? { ...s, messages: JSON.parse(s.messages) } : null;
    },
    createSession(project, title = "Phiên mới") {
      const s = {
        id: randomUUID(),
        project,
        title: title.slice(0, 120),
        updated: Date.now(),
        messages: [],
      };
      this.saveSession(s);
      return s;
    },
    saveSession(s) {
      db.prepare("INSERT OR REPLACE INTO sessions VALUES (?,?,?,?,?)").run(
        s.id,
        s.title,
        s.project,
        Date.now(),
        JSON.stringify(s.messages),
      );
    },
    recordEdit(project, file, before, after) {
      const id = randomUUID();
      db.prepare(
        "INSERT INTO edits (id,project,path,before,after,created,state) VALUES (?,?,?,?,?,?,'pending')",
      ).run(id, project, file, before, after, Date.now());
      return id;
    },
    edits(project) {
      return db
        .prepare(
          "SELECT id,path,created,state FROM edits WHERE project=? AND state IN ('committed','legacy_unverified') ORDER BY created DESC LIMIT 100",
        )
        .all(project);
    },
    edit(id) {
      return db.prepare("SELECT * FROM edits WHERE id=?").get(id);
    },
    draft(project, file) {
      return db
        .prepare("SELECT * FROM drafts WHERE project=? AND path=?")
        .get(project, file);
    },
    drafts(project) {
      return db
        .prepare(
          "SELECT path,updated,isNew FROM drafts WHERE project=? AND dirty=1 ORDER BY updated DESC",
        )
        .all(project);
    },
    saveDraft(project, file, content, baseHash, isNew, dirty) {
      db.prepare("INSERT OR REPLACE INTO drafts VALUES (?,?,?,?,?,?,?)").run(
        project,
        file,
        content,
        baseHash,
        Number(!!isNew),
        Number(!!dirty),
        Date.now(),
      );
    },
    close() {
      db.close();
    },
  };
}
