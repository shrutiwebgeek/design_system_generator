import { useState } from "react";
import { useComponents } from "./api";
import { Navbar } from "./components/navbar/navbar";
import { ComponentSidebar } from "./components/sidebar/component-sidebar";
import { Workspace } from "./components/workspace/workspace";
import { useFullScreen } from "./hooks/use-full-screen";
import { useSelection } from "./hooks/use-selection";
import type { WorkspaceTab } from "./lib/workspace-tab";
import * as styles from "./styles/app.styles";

function App() {
  const components = useComponents();
  const { component, selected, select } = useSelection(components.data);
  const [tab, setTab] = useState<WorkspaceTab>("preview");
  // Lives here, not in Workspace, so dark mode stays on when switching components.
  const [mode, setMode] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useFullScreen();

  return (
    <div className={styles.app}>
      {!fullScreen && <Navbar />}
      <div className={styles.body}>
        <ComponentSidebar
          components={components}
          selected={selected}
          onSelect={(next) => {
            select(next);
            setTab("preview");
          }}
          hidden={fullScreen}
        />
        {component && selected ? (
          <Workspace
            key={component.source}
            component={component}
            example={selected.example}
            tab={tab}
            onTabChange={setTab}
            mode={mode}
            onModeChange={setMode}
            fullScreen={fullScreen}
            onFullScreenChange={setFullScreen}
          />
        ) : (
          components.data && (
            <main className={styles.empty}>No component is ready yet.</main>
          )
        )}
      </div>
    </div>
  );
}

export default App;
