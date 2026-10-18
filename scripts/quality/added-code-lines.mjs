// Prints the lines a branch adds to a TypeScript file that are code, for scripts/quality/mutation.sh:
// not blank, and not inside a comment. Comments are found by the TypeScript parser, so a line that
// continues a block or JSX comment counts as comment, and a "/*" inside a string does not.
//
//   node scripts/quality/added-code-lines.mjs <base-rev> <file>
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import ts from "typescript";

const [base, file] = process.argv.slice(2);

function addedLineNumbers() {
  const tracked = execFileSync("git", ["ls-files", "--", file], { encoding: "utf8" }).trim();
  const text = readFileSync(file, "utf8");
  if (!tracked) return text.split("\n").map((_, index) => index + 1);
  const diff = execFileSync("git", ["diff", "-U0", base, "--", file], { encoding: "utf8" });
  const lines = [];
  for (const [, start, count] of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
    for (let i = 0; i < Number(count ?? 1); i++) lines.push(Number(start) + i);
  }
  return lines;
}

/** The file's text with every comment replaced by spaces, line breaks kept. */
function withoutComments(text) {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const ranges = new Map();
  const visit = (node) => {
    const found = [
      ...(ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []),
      ...(ts.getTrailingCommentRanges(text, node.getEnd()) ?? []),
    ];
    for (const range of found) ranges.set(range.pos, range.end);
    for (const child of node.getChildren(source)) visit(child);
  };
  visit(source);
  const chars = text.split("");
  for (const [pos, end] of ranges) {
    for (let i = pos; i < end; i++) if (chars[i] !== "\n") chars[i] = " ";
  }
  return chars.join("");
}

const lines = withoutComments(readFileSync(file, "utf8")).split("\n");
for (const number of addedLineNumbers()) {
  const line = lines[number - 1] ?? "";
  if (!/^[\s{}]*$/.test(line)) console.log(line);
}
