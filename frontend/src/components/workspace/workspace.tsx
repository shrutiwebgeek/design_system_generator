import { useState } from "react";
import { useGeneratedComponent } from "@/api";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { usePreviewFrame } from "@/hooks/use-preview-frame";
import type { ReadyComponent } from "@/lib/component-catalog";
import { isWorkspaceTab, type WorkspaceTab } from "@/lib/workspace-tab";
import * as styles from "@/styles/workspace.styles";
import { ControlsPanel } from "./controls/controls-panel";
import { PanelHeader } from "./panels/panel-header";
import { CodePanel, TestsPanel } from "./panels/editor-panel";
import { PreviewPanel } from "./panels/preview-panel";

interface WorkspaceProps {
  component: ReadyComponent;
  /** The story picked in the sidebar. */
  story: string;
  tab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  /** null until the user switches modes in the preview. */
  mode: string | null;
  onModeChange: (mode: string) => void;
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
}

/** The playground (middle) and the controls (right) for one component. Keyed by source, so state resets per component. */
export function Workspace({
  component: { source, label },
  story,
  tab,
  onTabChange,
  mode,
  onModeChange,
  fullScreen,
  onFullScreenChange,
}: WorkspaceProps) {
  const generated = useGeneratedComponent(source);
  const frameRef = usePreviewFrame({ story, mode, onModeChange });
  // Lives here, not in the Code panel, which unmounts when another tab opens.
  const [openFile, setOpenFile] = useState(`${source}.tsx`);

  return (
    <>
      <main className={styles.main}>
        <Tabs
          value={tab}
          onValueChange={(value: unknown) => {
            if (isWorkspaceTab(value)) onTabChange(value);
          }}
          className={styles.tabs}
        >
          <PanelHeader
            fullScreen={fullScreen}
            onFullScreenChange={onFullScreenChange}
          />
          {/* keepMounted: switching to Code and back shouldn't reload the frame. */}
          <TabsContent value="preview" keepMounted className={styles.panel}>
            <PreviewPanel source={source} label={label} frameRef={frameRef} />
          </TabsContent>
          <TabsContent value="code" className={styles.panel}>
            <CodePanel
              generated={generated}
              openFile={openFile}
              onOpenFileChange={setOpenFile}
            />
          </TabsContent>
          <TabsContent value="tests" className={styles.panel}>
            <TestsPanel generated={generated} />
          </TabsContent>
        </Tabs>
      </main>
      {!fullScreen && <ControlsPanel />}
    </>
  );
}
