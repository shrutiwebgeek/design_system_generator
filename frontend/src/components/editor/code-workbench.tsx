import type { RewriteWarning } from "@dsg/design-data/types";
import { useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TerminalCodicon } from "@/icons/terminal-codicon";
import type { EditorFile } from "@/lib/editor-files";
import * as styles from "@/styles/editor.styles";
import { FileEditor } from "./file-editor/file-editor";
import { Terminal } from "./terminal/terminal";

interface CodeWorkbenchProps {
  files: EditorFile[];
  openFile: string;
  onOpenFileChange: (name: string) => void;
  source: string;
  warnings: RewriteWarning[];
}

/**
 * The editor over a resizable terminal, like VS Code's panel. Drag the divider (or
 * focus it and use the arrow keys) to resize; drag it to the bottom or press × to
 * close; the terminal button in the editor header toggles it.
 */
export function CodeWorkbench({
  files,
  openFile,
  onOpenFileChange,
  source,
  warnings,
}: CodeWorkbenchProps) {
  const terminalRef = useRef<PanelImperativeHandle>(null);
  const [terminalOpen, setTerminalOpen] = useState(true);

  const closeTerminal = () => terminalRef.current?.collapse();
  const toggleTerminal = () => {
    if (terminalOpen) closeTerminal();
    else terminalRef.current?.expand();
  };

  return (
    <ResizablePanelGroup orientation="vertical">
      <ResizablePanel minSize="20" className={styles.workbenchPanel}>
        <FileEditor
          files={files}
          openFile={openFile}
          onOpenFileChange={onOpenFileChange}
          actions={
            <button
              type="button"
              aria-label="Terminal"
              aria-pressed={terminalOpen}
              title={terminalOpen ? "Hide terminal" : "Show terminal"}
              onClick={toggleTerminal}
              className={styles.iconButton}
            >
              <TerminalCodicon />
            </button>
          }
        />
      </ResizablePanel>
      <ResizableHandle className={styles.divider} />
      <ResizablePanel
        panelRef={terminalRef}
        defaultSize="30"
        minSize={96}
        collapsible
        collapsedSize={0}
        onResize={({ inPixels }) => setTerminalOpen(inPixels > 0)}
        className={styles.workbenchPanel}
      >
        <Terminal source={source} warnings={warnings} onClose={closeTerminal} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
