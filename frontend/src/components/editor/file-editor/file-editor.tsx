import { Tabs } from "@base-ui/react/tabs";
import { FileCodeIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
} from "@/components/ui/code-block";
import { useHighlightedCode } from "@/hooks/use-highlighted-code";
import type { EditorFile } from "@/lib/editor-files";
import * as styles from "@/styles/editor.styles";

interface FileEditorProps {
  files: EditorFile[];
  /** Name of the open file; the first one if it isn't in `files`. */
  openFile?: string;
  onOpenFileChange?: (name: string) => void;
  /** Extra header buttons, left of Copy. */
  actions?: ReactNode;
}

/**
 * A read-only VS Code-style editor: a tab per file, line numbers, copy.
 * Base UI Tabs directly rather than shadcn's, whose pill styling sits behind
 * group variants that a className can't override. Only the open file's panel is
 * mounted, so only that file gets highlighted.
 */
export function FileEditor({
  files,
  openFile,
  onOpenFileChange,
  actions,
}: FileEditorProps) {
  const active = files.find((f) => f.name === openFile) ?? files[0];
  if (!active) return null;

  return (
    <Tabs.Root
      value={active.name}
      onValueChange={(name: string) => onOpenFileChange?.(name)}
      className={styles.editor}
    >
      <CodeBlock className={styles.editorSurface}>
        <CodeBlockHeader className={styles.editorHeader}>
          <Tabs.List aria-label="Open files" className={styles.fileTabs}>
            {files.map(({ name }) => (
              <Tabs.Tab key={name} value={name} className={styles.fileTab}>
                <FileCodeIcon className={styles.fileIcon} />
                {name}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <CodeBlockActions className={styles.editorActions}>
            {actions}
            <CodeBlockCopyButton
              value={active.code}
              className={styles.copyButton}
            />
          </CodeBlockActions>
        </CodeBlockHeader>
        {files.map((file) => (
          <Tabs.Panel
            key={file.name}
            value={file.name}
            className={styles.filePanel}
          >
            <FileCode file={file} />
          </Tabs.Panel>
        ))}
      </CodeBlock>
    </Tabs.Root>
  );
}

/**
 * The pre is focusable for keyboard scrolling. shadcn draws its focus ring from a
 * direct child of the block, which the tab panel around this breaks, so it has its own.
 */
function FileCode({ file }: { file: EditorFile }) {
  const lines = useHighlightedCode(file.code, "tsx");
  return (
    <CodeBlockContent lineNumbers className={styles.fileCode}>
      {lines.map((line, i) => (
        <CodeBlockLine key={i} className={styles.codeLine}>
          {line}
        </CodeBlockLine>
      ))}
    </CodeBlockContent>
  );
}
