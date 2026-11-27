import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import * as styles from "@/styles/workspace.styles";

export interface ScaleStep {
  /** What's stored: "xs", or a token value like "8px". */
  value: string;
  /** How it reads: "xs · 24px", "md · 8px". */
  text: string;
  /** Its size, e.g. "24px": where it sits on the scale. */
  size: string;
}

interface ScaleSliderProps {
  label: string;
  steps: ScaleStep[];
  value: string;
  onChange: (value: string) => void;
}

/** A slider over a scale's steps, smallest first, with the current step beside the label. */
export function ScaleSlider({
  label,
  steps,
  value,
  onChange,
}: ScaleSliderProps) {
  const px = (step: ScaleStep) => Number.parseFloat(step.size) || 0;
  const ordered = [...steps].sort((a, b) => px(a) - px(b));
  const index = Math.max(
    0,
    ordered.findIndex((s) => s.value === value),
  );
  return (
    <div className={styles.controlField}>
      <div className={styles.sliderHeader}>
        <Label>{label}</Label>
        <span className={styles.sliderValue}>{ordered[index]?.text}</span>
      </div>
      <Slider
        className={styles.slider}
        value={[index]}
        min={0}
        max={Math.max(0, ordered.length - 1)}
        step={1}
        onValueChange={(next) => {
          const step = ordered[Array.isArray(next) ? (next[0] ?? 0) : next];
          if (step) onChange(step.value);
        }}
        getAriaLabel={() => label}
        getAriaValueText={(_, i) => ordered[i]?.text ?? ""}
      />
      <div aria-hidden="true" className={styles.sliderMarks}>
        {ordered.map((step, i) => (
          <span
            key={step.value}
            className={styles.sliderMark}
            // Under each step's thumb position: the 16px thumb stays inside the track.
            style={{
              left: `calc(8px + (100% - 16px) * ${ordered.length > 1 ? i / (ordered.length - 1) : 0})`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
