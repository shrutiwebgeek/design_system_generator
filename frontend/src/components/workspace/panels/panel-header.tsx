import { DownloadIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as styles from "@/styles/workspace.styles";
import { IconTip } from "../icon-tip";

interface FullScreenProps {
  fullScreen: boolean;
  onFullScreenChange: (fullScreen: boolean) => void;
}

/** Preview / Code / Tests, flat and underlined. */
export function PanelHeader(fullScreenProps: FullScreenProps) {
  return (
    <div className={styles.panelHeader}>
      <TabsList variant="line" className={styles.tabList}>
        <TabsTrigger value="preview" className={styles.tab}>
          Preview
        </TabsTrigger>
        <TabsTrigger value="code" className={styles.tab}>
          Code
        </TabsTrigger>
        <TabsTrigger value="tests" className={styles.tab}>
          Tests
        </TabsTrigger>
      </TabsList>
      <PanelActions {...fullScreenProps} />
    </div>
  );
}

function PanelActions({ fullScreen, onFullScreenChange }: FullScreenProps) {
  const FullScreenIcon = fullScreen ? Minimize2Icon : Maximize2Icon;
  return (
    <div className={styles.panelActions}>
      {/* Zip download is the next step after the UI.
          focusableWhenDisabled: keyboard and screen-reader users can still reach it and
          its tooltip (a natively disabled button gets no pointer or focus events). */}
      <IconTip label="Download: coming soon">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled
          focusableWhenDisabled
          aria-label="Download (coming soon)"
          className={styles.disabledIconButton}
        >
          <DownloadIcon aria-hidden="true" />
        </Button>
      </IconTip>
      <IconTip label={fullScreen ? "Exit full screen (Esc)" : "Full screen"}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={fullScreen ? "Exit full screen" : "Full screen"}
          onClick={() => onFullScreenChange(!fullScreen)}
        >
          <FullScreenIcon aria-hidden="true" />
        </Button>
      </IconTip>
    </div>
  );
}
