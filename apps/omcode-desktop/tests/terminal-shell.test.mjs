import assert from "node:assert/strict";
import test from "node:test";
import { terminalShell } from "../server/index.mjs";

const present = (...files) => (file) => files.includes(file);

test("uses the user's SHELL when it is an executable absolute path", () => {
  assert.deepEqual(terminalShell({ SHELL: "/usr/bin/fish" }, present("/usr/bin/fish", "/bin/sh")), { shell: "/usr/bin/fish", args: ["-c"] });
});

test("keeps zsh without rc files where zsh is chosen", () => {
  assert.deepEqual(terminalShell({ SHELL: "/bin/zsh" }, present("/bin/zsh")), { shell: "/bin/zsh", args: ["-f", "-c"] });
  assert.deepEqual(terminalShell({}, present("/bin/zsh", "/bin/sh")), { shell: "/bin/zsh", args: ["-f", "-c"] });
});

test("never passes zsh's -f to another shell", () => {
  assert.deepEqual(terminalShell({ SHELL: "/bin/bash" }, present("/bin/bash")).args, ["-c"]);
});

test("falls back to /bin/sh when SHELL is missing, relative or not executable and zsh is absent", () => {
  for (const SHELL of [undefined, "", "bash", "/nope/shell"]) {
    assert.deepEqual(terminalShell({ SHELL }, present("/bin/sh")), { shell: "/bin/sh", args: ["-c"] });
  }
});
