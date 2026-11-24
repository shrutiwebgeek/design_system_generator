import type { RewriteWarning, WarningReason } from "@dsg/design-data/types";

const color = (code: number) => (text: string) => `\x1b[${code}m${text}\x1b[0m`;
const yellow = color(33);
const green = color(32);
// Bright black: about 3:1 on the editor, so only for decoration, never for text that matters.
const gray = color(90);

const REASONS: Readonly<Record<WarningReason, string>> = {
  snapped: "off the scale, snapped to the nearest token",
  unmapped: "no token for this step, kept as is",
  arbitrary: "arbitrary value, can't map to a token, kept as is",
};

const warningLines = ({ original, replacement, reason }: RewriteWarning) => [
  `${yellow("warn")}  ${replacement ? `${original} → ${replacement}` : original}`,
  `      ${REASONS[reason]}`,
];

function summary(count: number): string {
  if (count === 0) return "done, every class mapped onto a token";
  return `done with ${count} ${count === 1 ? "warning" : "warnings"}`;
}

/** The rewrite log as ANSI text, so the code block colors it like a terminal. */
export function terminalLog(
  source: string,
  warnings: RewriteWarning[],
): string {
  return [
    `${gray("❯")} rewriting ${source} onto your tokens`,
    ...warnings.flatMap(warningLines),
    `${green("✔")} ${summary(warnings.length)}`,
  ].join("\n");
}

// eslint-disable-next-line no-control-regex -- matching ANSI escape sequences is the point
const ANSI = /\x1b\[[0-9;]*m/g;

export const stripAnsi = (line: string): string => line.replace(ANSI, "");
