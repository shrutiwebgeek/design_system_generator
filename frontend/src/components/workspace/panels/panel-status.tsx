import type { ReactNode } from "react";
import { status } from "@/styles/workspace.styles";

interface PanelStatusProps {
  children: ReactNode;
  /** An error, announced to screen readers. */
  alert?: boolean;
}

/** A panel's loading or error message. */
export function PanelStatus({ children, alert = false }: PanelStatusProps) {
  return (
    <p data-status="" role={alert ? "alert" : undefined} className={status}>
      {children}
    </p>
  );
}
