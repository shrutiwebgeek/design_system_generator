import { note } from "@/styles/atoms";
import * as styles from "@/styles/workspace.styles";

/** Kept free on purpose; property controls come later. */
export function ControlsPanel() {
  return (
    <aside aria-label="Controls" className={styles.controls}>
      <h2 className={styles.controlsTitle}>Controls</h2>
      <p className={note}>Nothing here yet.</p>
    </aside>
  );
}
