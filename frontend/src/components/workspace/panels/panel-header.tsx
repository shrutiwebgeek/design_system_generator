import { DownloadIcon, Maximize2Icon, Minimize2Icon } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as styles from "@/styles/workspace.styles";

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
          className={styles.downloadButton}
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

interface IconTipProps {
  label: string;
  children: ReactElement;
}

/**
 * Replaces the native `title`, which Chrome shows only after about a second of
 * hovering, in small system text, and never on keyboard focus. This one opens at once
 * on hover and on focus, below the button.
 */
function IconTip({ label, children }: IconTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom" className={styles.tipContent}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
