# VERIFY T3 74a89b4 (WO-T3-21 desktop terminal shell)
Diff from verified c036f21: `apps/omcode-desktop/server/index.mjs` (`terminalShell()`: SHELL if absolute and executable, else /bin/zsh, else /bin/sh; `-f` only for zsh), new `tests/terminal-shell.test.mjs`, report.
- VERIFIED_WORKTREE_ONLY: exact SHA in a separate worktree, `npm ci` exit 0, `npm test` in apps/omcode-desktop: 117 tests, 117 pass, 0 fail, 0 skipped (T3 claim 117/0/0). The two failures T4 reported in WO-T4-19 (terminal test needing `/bin/zsh`) now pass here.
- Code read: candidates must be absolute paths and pass an X_OK check; command string is passed as one argument after `-c` as before; no new input reaches the shell. Behaviour with a user-controlled SHELL is local to the user's own session.
- Not run: desktop `test:ui/native/install/live`. Hosted CI NOT_CHECKED (T3 branch has no run).
