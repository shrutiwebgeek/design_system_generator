import type {
  ComponentSummary,
  GenerateResponse,
} from "@dsg/design-data/types";
import { DownloadIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useGeneratedComponent, usePreview } from "@/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePreviewFrame } from "@/preview-frame";

// The editor pulls in Shiki; load it the first time Code or Tests opens.
const Editor = lazy(() =>
  import("./editor").then((m) => ({ default: m.Editor })),
);
const CodeWorkbench = lazy(() =>
  import("./editor").then((m) => ({ default: m.CodeWorkbench })),
);

export type Tab = "preview" | "code" | "tests";

/**
 * Panel-header tabs, like Storybook's addon panel: flat, underlined when active.
 * shadcn's inactive text-foreground/60 fails AA; muted-foreground is 6.11 on the card.
 * The underline sits on the header's bottom edge (shadcn puts it 5px below the tab).
 */
const tabClass =
  "h-full flex-none rounded-none px-3 text-muted-foreground group-data-horizontal/tabs:after:bottom-0";

interface Props {
  component: ComponentSummary;
  /** The example file picked in the sidebar. */
  example: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  /** null until the user switches modes in the frame: the frame's own mode applies. */
  mode: string | null;
  onModeChange: (mode: string) => void;
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
}

/** The playground (middle) and the controls (right) for one component. Keyed by source, so state resets per component. */
export function Workspace({
  component,
  example,
  tab,
  onTabChange,
  mode: chosenMode,
  onModeChange,
  fullScreen,
  onFullScreenChange,
}: Props) {
  const source = component.source!;
  const preview = usePreview(source);
  const generated = useGeneratedComponent(source);
  const { frameRef, info, select } = usePreviewFrame(onModeChange);
  const [chosenFile, setChosenFile] = useState(`${source}.tsx`);

  // Fall back to what the frame opened with for anything it doesn't know.
  const shownExample = info?.examples.includes(example)
    ? example
    : info?.examples[0];
  const mode =
    chosenMode && info?.modes.includes(chosenMode) ? chosenMode : info?.mode;

  // `info` is a dependency on purpose: a reloaded frame starts at its defaults,
  // reports in with a new `info`, and gets the current selection again.
  useEffect(() => {
    if (shownExample && mode) select(shownExample, mode);
  }, [info, shownExample, mode, select]);

  const testFile = `${source}.test.tsx`;
  const warnings = generated.data?.warnings ?? [];

  return (
    <>
      <main className="flex min-w-0 flex-1 flex-col">
        {!fullScreen && (
          <div className="px-4 py-3">
            <h1 className="font-heading text-xl font-semibold">
              {component.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {component.description}
            </p>
          </div>
        )}
        <Tabs
          value={tab}
          onValueChange={(value) => onTabChange(value as Tab)}
          className="min-h-0 flex-1 gap-0"
        >
          <div className="flex h-10 shrink-0 items-stretch justify-between border-y bg-card ps-1 pe-2">
            <TabsList
              variant="line"
              className="h-full gap-0 rounded-none p-0 group-data-horizontal/tabs:h-full"
            >
              <TabsTrigger value="preview" className={tabClass}>
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className={tabClass}>
                Code
                {warnings.length > 0 && (
                  <Badge variant="secondary">
                    {warnings.length}
                    <span className="sr-only"> warnings</span>
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tests" className={tabClass}>
                Tests
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              {/* Zip download is the next step after the UI; the API already returns every file. */}
              <span className="text-xs text-muted-foreground">Coming soon</span>
              <Button variant="outline" size="sm" disabled>
                <DownloadIcon data-icon="inline-start" aria-hidden="true" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={fullScreen ? "Exit full screen" : "Full screen"}
                title={fullScreen ? "Exit full screen (Esc)" : "Full screen"}
                onClick={() => onFullScreenChange(!fullScreen)}
              >
                {fullScreen ? (
                  <Minimize2Icon aria-hidden="true" />
                ) : (
                  <Maximize2Icon aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {/* keepMounted: switching to Code and back shouldn't reload the frame. */}
          <TabsContent value="preview" keepMounted className="min-h-0">
            {preview.isPending && <Status>Building preview…</Status>}
            {preview.isError && <Status alert>{preview.error.message}</Status>}
            {preview.data && (
              // allow-scripts only: the frame gets an opaque origin, so preview code
              // can't reach this page's DOM, cookies or storage.
              <iframe
                ref={frameRef}
                title={`${component.label} preview`}
                sandbox="allow-scripts"
                srcDoc={preview.data}
                className="block size-full"
              />
            )}
          </TabsContent>
          <TabsContent value="code" className="min-h-0">
            <EditorFrame>
              <Generated query={generated}>
                {(data) => (
                  <CodeWorkbench
                    files={codeFiles(data, testFile)}
                    value={chosenFile}
                    onValueChange={setChosenFile}
                    source={source}
                    warnings={data.warnings}
                  />
                )}
              </Generated>
            </EditorFrame>
          </TabsContent>
          <TabsContent value="tests" className="min-h-0">
            <EditorFrame>
              <Generated query={generated}>
                {(data) => (
                  <Editor
                    files={[{ name: testFile, code: data.files[testFile] }]}
                    value={testFile}
                  />
                )}
              </Generated>
            </EditorFrame>
          </TabsContent>
        </Tabs>
      </main>

      {/* Kept free on purpose (her call, 2026-11-20); property controls come later. */}
      {!fullScreen && (
        <aside
          aria-label="Controls"
          className="flex w-72 shrink-0 flex-col gap-2 overflow-y-auto border-l p-4"
        >
          <h2 className="font-heading text-sm font-semibold">Controls</h2>
          <p className="text-sm text-muted-foreground">Nothing here yet.</p>
        </aside>
      )}
    </>
  );
}

/** Code tab files, VS Code-style: the component's own first, then the shared ones. The test has its own tab. */
function codeFiles(data: GenerateResponse, testFile: string) {
  return [
    ...Object.entries(data.files).filter(([name]) => name !== testFile),
    ...Object.entries(data.shared),
  ].map(([name, code]) => ({ name, code }));
}

function Generated({
  query,
  children,
}: {
  query: ReturnType<typeof useGeneratedComponent>;
  children: (data: GenerateResponse) => ReactNode;
}) {
  if (query.isPending) return <Status>Generating…</Status>;
  if (query.isError) return <Status alert>{query.error.message}</Status>;
  return children(query.data);
}

/** The dark editor area that fills the Code and Tests panels. */
function EditorFrame({ children }: { children: ReactNode }) {
  return (
    // Status text inside the dark frame takes the editor's colors: the app's muted brown is ~2.5:1 here.
    <div className="flex size-full flex-col bg-editor text-editor-foreground [&_[data-status]]:text-editor-foreground">
      <Suspense fallback={<Status>Loading editor…</Status>}>
        {children}
      </Suspense>
    </div>
  );
}

function Status({ children, alert }: { children: ReactNode; alert?: boolean }) {
  return (
    <p
      data-status=""
      role={alert ? "alert" : undefined}
      className="flex size-full items-center justify-center p-4 text-sm text-muted-foreground"
    >
      {children}
    </p>
  );
}
