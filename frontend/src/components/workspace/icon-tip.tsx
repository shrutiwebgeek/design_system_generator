import type { ReactElement } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as styles from "@/styles/workspace.styles";

interface IconTipProps {
  label: string;
  children: ReactElement;
}

/**
 * Replaces the native `title`, which Chrome shows only after about a second of
 * hovering, in small system text, and never on keyboard focus. This one opens at once
 * on hover and on focus, below the button.
 */
export function IconTip({ label, children }: IconTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="bottom" className={styles.tipContent}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
