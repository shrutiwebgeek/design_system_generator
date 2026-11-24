import type { RewriteWarning } from "@dsg/design-data/types";
import { XIcon } from "lucide-react";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockLine,
} from "@/components/ui/code-block";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";
import { stripAnsi, terminalLog } from "@/lib/terminal-log";
import * as styles from "@/styles/editor.styles";

interface TerminalProps {
  source: string;
  warnings: RewriteWarning[];
  onClose: () => void;
}

/** VS Code's terminal panel, showing the rewrite warnings. */
export function Terminal({ source, warnings, onClose }: TerminalProps) {
  const lines = useHighlightedCode(terminalLog(source, warnings), "ansi");
  return (
    <section
      aria-label="Terminal: rewrite warnings"
      className={styles.terminal}
    >
      <div className={styles.terminalHeader}>
        <span className={styles.terminalTitle}>Terminal</span>
        <button
          type="button"
          aria-label="Close terminal"
          title="Close terminal"
          onClick={onClose}
          className={styles.iconButton}
        >
          <XIcon />
        </button>
      </div>
      <CodeBlock className={styles.terminalSurface}>
        <CodeBlockContent className={styles.terminalCode}>
          {lines.map((line, i) => (
            // Before the highlighter loads, lines are raw strings: hide the escape codes.
            <CodeBlockLine key={i}>
              {typeof line === "string" ? stripAnsi(line) : line}
            </CodeBlockLine>
          ))}
        </CodeBlockContent>
      </CodeBlock>
    </section>
  );
}
