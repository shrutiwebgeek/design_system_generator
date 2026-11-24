import type { GenerateResponse } from "@dsg/design-data/types";
import type { UseQueryResult } from "@tanstack/react-query";
import { lazy, Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary/error-boundary";
import { codeFiles, testFiles } from "@/lib/editor-files";
import { editorPanel } from "@/styles/workspace.styles";
import { PanelStatus } from "./panel-status";

// The editor pulls in Shiki; load it the first time Code or Tests opens.
const CodeWorkbench = lazy(() =>
  import("@/components/editor/code-workbench").then((m) => ({
    default: m.CodeWorkbench,
  })),
);
const FileEditor = lazy(() =>
  import("@/components/editor/file-editor/file-editor").then((m) => ({
    default: m.FileEditor,
  })),
);

interface GeneratedProps {
  generated: UseQueryResult<GenerateResponse>;
}

interface CodePanelProps extends GeneratedProps {
  openFile: string;
  onOpenFileChange: (name: string) => void;
}

/** The generated files, with the rewrite warnings in a terminal. */
export function CodePanel({ generated, ...editor }: CodePanelProps) {
  return (
    <EditorPanel generated={generated}>
      {(data) => (
        <CodeWorkbench
          {...editor}
          files={codeFiles(data)}
          source={data.source}
          warnings={data.warnings}
        />
      )}
    </EditorPanel>
  );
}

/** The predefined test, read only. */
export function TestsPanel({ generated }: GeneratedProps) {
  return (
    <EditorPanel generated={generated}>
      {(data) => <FileEditor files={testFiles(data)} />}
    </EditorPanel>
  );
}

interface EditorPanelProps extends GeneratedProps {
  children: (data: GenerateResponse) => ReactNode;
}

/** The dark area behind both: waits for the generated files, then for the editor. */
function EditorPanel({ generated, children }: EditorPanelProps) {
  return (
    <div className={editorPanel}>{editorContent(generated, children)}</div>
  );
}

function editorContent(
  { data, error }: UseQueryResult<GenerateResponse>,
  render: (data: GenerateResponse) => ReactNode,
) {
  // Data first: a failed background refetch shouldn't replace working code.
  if (data) {
    return (
      <ErrorBoundary message="The editor couldn't be loaded.">
        <Suspense fallback={<PanelStatus>Loading editor…</PanelStatus>}>
          {render(data)}
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (error) return <PanelStatus alert>{error.message}</PanelStatus>;
  return <PanelStatus>Generating…</PanelStatus>;
}
