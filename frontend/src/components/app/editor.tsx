// Loaded lazily (see workspace.tsx): this module pulls in Shiki through the
// highlighter, so Preview never pays for it.
import { Tabs } from "@base-ui/react/tabs";
import type { RewriteWarning, WarningReason } from "@dsg/design-data/types";
import { BracesIcon, FileCodeIcon, HashIcon, XIcon } from "lucide-react";
import { useRef, useState, type ReactNode, type SVGProps } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
} from "@/components/ui/code-block";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";

const LANGUAGES: Record<string, string> = {
  tsx: "tsx",
  ts: "typescript",
  css: "css",
  json: "json",
};

const extension = (file: string) => file.slice(file.lastIndexOf(".") + 1);
const basename = (file: string) => file.slice(file.lastIndexOf("/") + 1);

/** File icons in the colors of VS Code's default (Seti) icon theme. */
function FileIcon({ file }: { file: string }) {
  const ext = extension(file);
  if (ext === "css") return <HashIcon className="text-[#519aba]" />;
  if (ext === "json") return <BracesIcon className="text-[#cbcb41]" />;
  return <FileCodeIcon className="text-[#519aba]" />;
}

/**
 * VS Code's "terminal" codicon, from @vscode/codicons 0.0.46
 * (https://github.com/microsoft/vscode-codicons), © Microsoft, licensed CC BY 4.0
 * (https://creativecommons.org/licenses/by/4.0/). Unmodified.
 */
function TerminalCodicon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.75 1.5H5.25C3.1815 1.5 1.5 3.183 1.5 5.25V18.75C1.5 20.8185 3.1815 22.5 5.25 22.5H18.75C20.8185 22.5 22.5 20.8185 22.5 18.75V5.25C22.5 3.183 20.8185 1.5 18.75 1.5ZM21 18.75C21 19.9905 19.9905 21 18.75 21H5.25C4.0095 21 3 19.9905 3 18.75V5.25C3 4.0095 4.0095 3 5.25 3H18.75C19.9905 3 21 4.0095 21 5.25V18.75ZM10.281 13.281L5.781 17.781C5.634 17.928 5.442 18 5.25 18C5.058 18 4.866 17.9265 4.719 17.781C4.4265 17.4885 4.4265 17.013 4.719 16.7205L8.688 12.7515L4.719 8.7825C4.4265 8.49 4.4265 8.0145 4.719 7.722C5.0115 7.4295 5.487 7.4295 5.7795 7.722L10.2795 12.222C10.572 12.5145 10.572 12.99 10.2795 13.2825L10.281 13.281ZM19.5 17.25C19.5 17.664 19.164 18 18.75 18H11.25C10.836 18 10.5 17.664 10.5 17.25C10.5 16.836 10.836 16.5 11.25 16.5H18.75C19.164 16.5 19.5 16.836 19.5 17.25Z" />
    </svg>
  );
}

const iconButton =
  "inline-flex size-7 items-center justify-center rounded text-editor-foreground outline-none hover:bg-white/10 hover:text-editor-tab-foreground focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-editor-focus aria-pressed:bg-white/10 aria-pressed:text-editor-tab-foreground [&_svg]:size-4";

export interface EditorFile {
  name: string;
  code: string;
}

/**
 * A read-only VS Code-style editor: a tab per file, line numbers, copy.
 * Base UI Tabs directly rather than shadcn's, whose pill styling sits behind
 * group variants that a className can't override.
 */
export function Editor({
  files,
  value,
  onValueChange,
  actions,
}: {
  files: EditorFile[];
  value: string;
  onValueChange?: (file: string) => void;
  /** Extra header buttons, left of Copy. */
  actions?: ReactNode;
}) {
  const active = files.find((f) => f.name === value) ?? files[0];
  return (
    <Tabs.Root
      value={active.name}
      onValueChange={(v) => onValueChange?.(v as string)}
      className="flex size-full min-h-0 flex-col"
    >
      {/* Default size, not "sm": sm's padding sits behind a group-data variant
          that className can't override. text-xs gives VS Code's 12px instead. */}
      <CodeBlock className="min-h-0 flex-1 rounded-none border-0 bg-editor text-xs text-editor-foreground">
        <CodeBlockHeader className="gap-0 bg-editor-tabs p-0 pe-2 text-editor-foreground">
          <Tabs.List
            aria-label="Open files"
            className="flex min-w-0 overflow-x-auto"
          >
            {files.map((f) => (
              <Tabs.Tab
                key={f.name}
                value={f.name}
                title={f.name}
                className="flex h-9 shrink-0 items-center gap-1.5 border-e border-editor-border px-3 text-[13px] text-editor-tab-inactive-foreground outline-none hover:text-editor-foreground focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-editor-focus data-active:bg-editor data-active:text-editor-tab-foreground [&_svg]:size-4"
              >
                <FileIcon file={f.name} />
                {basename(f.name)}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <CodeBlockActions className="gap-0.5">
            {actions}
            <CodeBlockCopyButton
              value={active.code}
              className="text-editor-foreground hover:bg-white/10 hover:text-editor-tab-foreground"
            />
          </CodeBlockActions>
        </CodeBlockHeader>
        {files.map((f) => (
          <Tabs.Panel
            key={f.name}
            value={f.name}
            className="flex min-h-0 flex-1 flex-col outline-none"
          >
            <FileCode file={f} />
          </Tabs.Panel>
        ))}
      </CodeBlock>
    </Tabs.Root>
  );
}

/** Only the active panel is mounted, so only the open file gets highlighted. */
function FileCode({ file }: { file: EditorFile }) {
  const lines = useHighlightedCode(
    file.code,
    LANGUAGES[extension(file.name)] ?? "text",
  );
  return (
    // The pre is focusable for keyboard scrolling; shadcn's ring targets it as a
    // direct child of the block, which the tab panel wrapper breaks, so it draws its own.
    <CodeBlockContent
      lineNumbers
      className="flex-1 focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-editor-focus"
    >
      {lines.map((line, i) => (
        <CodeBlockLine key={i} className="before:text-editor-line-number">
          {line}
        </CodeBlockLine>
      ))}
    </CodeBlockContent>
  );
}

/**
 * The Code tab: the editor over a resizable terminal, like VS Code's panel.
 * Drag the divider (or focus it and use the arrow keys) to resize; drag it to the
 * bottom or press × to close; the terminal button in the editor header toggles it.
 */
export function CodeWorkbench({
  files,
  value,
  onValueChange,
  source,
  warnings,
}: {
  files: EditorFile[];
  value: string;
  onValueChange: (file: string) => void;
  source: string;
  warnings: RewriteWarning[];
}) {
  const terminal = useRef<PanelImperativeHandle>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const toggleTerminal = () => {
    if (terminal.current?.isCollapsed()) terminal.current.expand();
    else terminal.current?.collapse();
  };

  return (
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel minSize="20" className="flex min-h-0 flex-col">
        <Editor
          files={files}
          value={value}
          onValueChange={onValueChange}
          actions={
            <button
              type="button"
              aria-label="Terminal"
              aria-pressed={terminalOpen}
              title={terminalOpen ? "Hide terminal" : "Show terminal"}
              onClick={toggleTerminal}
              className={iconButton}
            >
              <TerminalCodicon />
            </button>
          }
        />
      </ResizablePanel>
      <ResizableHandle className="bg-editor-border hover:bg-editor-focus focus-visible:ring-editor-focus" />
      <ResizablePanel
        panelRef={terminal}
        defaultSize="30"
        minSize={96}
        collapsible
        collapsedSize={0}
        onResize={(size) => setTerminalOpen(size.inPixels > 0)}
        className="flex min-h-0 flex-col"
      >
        <Terminal
          source={source}
          warnings={warnings}
          onClose={() => terminal.current?.collapse()}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

const ESC = "\x1b[";
const color = (code: number) => (text: string) =>
  `${ESC}${code}m${text}${ESC}0m`;
const yellow = color(33);
const green = color(32);
// Bright black: about 3:1 on the editor, so only for decoration, never for text that matters.
const gray = color(90);
// eslint-disable-next-line no-control-regex -- matching ANSI escape sequences is the point
const ANSI = /\x1b\[[0-9;]*m/g;

const REASONS: Record<WarningReason, string> = {
  snapped: "off the scale, snapped to the nearest token",
  unmapped: "no token for this step, kept as is",
  arbitrary: "arbitrary value, can't map to a token, kept as is",
};

/** The rewrite log as ANSI text, so the code block colors it like a terminal. */
function terminalText(source: string, warnings: RewriteWarning[]) {
  const lines = [`${gray("❯")} rewriting ${source} onto your tokens`];
  for (const w of warnings) {
    const change = w.replacement
      ? `${w.original} → ${w.replacement}`
      : w.original;
    lines.push(`${yellow("warn")}  ${change}`, `      ${REASONS[w.reason]}`);
  }
  lines.push(
    warnings.length === 0
      ? `${green("✔")} done, every class mapped onto a token`
      : `${green("✔")} done with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`,
  );
  return lines.join("\n");
}

/** VS Code's terminal panel, showing the rewrite warnings. */
function Terminal({
  source,
  warnings,
  onClose,
}: {
  source: string;
  warnings: RewriteWarning[];
  onClose: () => void;
}) {
  const lines = useHighlightedCode(terminalText(source, warnings), "ansi");
  return (
    <section
      aria-label="Terminal: rewrite warnings"
      className="flex min-h-0 flex-1 flex-col bg-editor"
    >
      <div className="flex h-8 shrink-0 items-center justify-between ps-4 pe-2">
        <span className="border-b border-editor-tab-foreground pb-0.5 text-[11px] tracking-wide text-editor-tab-foreground uppercase">
          Terminal
        </span>
        <button
          type="button"
          aria-label="Close terminal"
          title="Close terminal"
          onClick={onClose}
          className={iconButton}
        >
          <XIcon />
        </button>
      </div>
      <CodeBlock className="min-h-0 flex-1 rounded-none border-0 bg-editor text-xs text-terminal-foreground">
        <CodeBlockContent className="flex-1 pt-1 focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-editor-focus">
          {lines.map((line, i) => (
            // Before the highlighter loads, lines are raw strings: hide the escape codes.
            <CodeBlockLine key={i}>
              {typeof line === "string" ? line.replace(ANSI, "") : line}
            </CodeBlockLine>
          ))}
        </CodeBlockContent>
      </CodeBlock>
    </section>
  );
}
