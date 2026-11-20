import { useEffect, useState } from "react";
import { useComponents } from "./api";
import {
  ComponentSidebar,
  type Selection,
} from "./components/app/component-sidebar";
import { Navbar } from "./components/app/navbar";
import { isReady } from "./components/app/ready";
import { Workspace, type Tab } from "./components/app/workspace";
import { ScrollArea } from "./components/ui/scroll-area";

/** Storybook-style layout: the explorer on the left, playground in the middle, controls on the right. */
function App() {
  const components = useComponents();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [tab, setTab] = useState<Tab>("preview");
  // Lives here, not in Workspace, so dark mode stays on when switching components.
  const [mode, setMode] = useState<string | null>(null);
  // The middle panel fills the window, like Storybook's full screen.
  const [fullScreen, setFullScreen] = useState(false);

  // Esc leaves full screen. Keys pressed inside the preview frame don't reach
  // this page (it's a separate document), so the button stays the sure way out.
  useEffect(() => {
    if (!fullScreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullScreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullScreen]);

  const ready = components.data?.filter(isReady) ?? [];
  const current = ready.find((c) => c.source === selection?.source) ?? ready[0];
  const example =
    current &&
    (selection?.source === current.source &&
    current.examples.includes(selection.example)
      ? selection.example
      : current.examples[0]);
  const selected =
    current && example ? { source: current.source!, example } : undefined;

  return (
    <div className="flex h-svh flex-col">
      {!fullScreen && <Navbar />}
      <div className="flex min-h-0 flex-1">
        {/* Hidden, not unmounted, in full screen: open folders and the search survive. */}
        <aside
          aria-label="Explorer"
          hidden={fullScreen}
          className="w-64 shrink-0 border-r"
        >
          <ScrollArea className="h-full">
            {components.isPending && (
              <p className="p-4 text-sm text-muted-foreground">
                Loading components…
              </p>
            )}
            {components.isError && (
              <p role="alert" className="p-4 text-sm text-destructive">
                {components.error.message}
              </p>
            )}
            {components.data && (
              <ComponentSidebar
                components={components.data}
                selected={selected}
                onSelect={(next) => {
                  setSelection(next);
                  // Picking an example file means "show me this example".
                  setTab("preview");
                }}
              />
            )}
          </ScrollArea>
        </aside>
        {current && example ? (
          <Workspace
            key={current.source}
            component={current}
            example={example}
            tab={tab}
            onTabChange={setTab}
            mode={mode}
            onModeChange={setMode}
            fullScreen={fullScreen}
            onFullScreenChange={setFullScreen}
          />
        ) : (
          components.data && (
            <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              No component is ready yet.
            </main>
          )
        )}
      </div>
    </div>
  );
}

export default App;
