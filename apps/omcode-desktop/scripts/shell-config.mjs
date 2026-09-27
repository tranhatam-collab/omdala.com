const MARKER = "# OMCODE local launcher";
const PATH_LINE = 'export PATH="$HOME/.local/bin:$PATH"';

export function ensureLauncherPath(source) {
  const lines = String(source)
    .split(/\r?\n/)
    .filter(
      (line) =>
        line !== MARKER &&
        line !== PATH_LINE &&
        !/^\s*alias\s+omcode=/.test(line),
    );
  while (lines.at(-1) === "") lines.pop();
  if (lines.length) lines.push("");
  lines.push(MARKER, PATH_LINE, "");
  return lines.join("\n");
}

export const launcherPathLine = PATH_LINE;
