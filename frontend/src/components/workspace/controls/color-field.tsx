import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as styles from "@/styles/workspace.styles";

interface ColorFieldProps {
  label: string;
  /** A hex color, #RRGGBB or #RRGGBBAA. */
  value: string;
  onChange: (value: string) => void;
}

/**
 * 6 or 8 digits only. #ff0 and #ff00 are valid CSS too, so accepting them would
 * flash the button yellow on the way to #ff0000.
 */
const HEX = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** A color picker and the hex as text, with an error tooltip while the text isn't a hex. */
export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const id = useId();
  const errorId = useId();
  // What's typed, until it's a hex or the field loses focus.
  const [draft, setDraft] = useState<string | null>(null);
  const invalid = draft !== null && !HEX.test(draft);

  const rgb = HEX.test(value) ? value.slice(0, 7) : null;
  const alpha = HEX.test(value) ? value.slice(7) : "";
  // A fully transparent value shows no color, so the swatch is crossed out.
  const unset = rgb === null || alpha.toUpperCase() === "00";

  return (
    <div className={styles.controlField}>
      <Label htmlFor={id}>{label}</Label>
      <div className={styles.colorRow}>
        <input
          type="color"
          aria-label={`${label}: pick a color`}
          // The picker has no alpha: it shows the color, and keeps the value's alpha
          // (unless that hid it entirely).
          value={(rgb ?? "#000000").toLowerCase()}
          onChange={(e) =>
            onChange(
              (
                e.target.value + (alpha.toUpperCase() === "00" ? "" : alpha)
              ).toUpperCase(),
            )
          }
          className={unset ? styles.swatchUnset : styles.swatch}
        />
        <Tooltip open={invalid}>
          <TooltipTrigger
            render={
              <Input
                id={id}
                value={draft ?? value}
                spellCheck={false}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(e) => {
                  const next = e.target.value;
                  setDraft(next);
                  if (HEX.test(next)) onChange(next.toUpperCase());
                }}
                onBlur={() => setDraft(null)}
              />
            }
          />
          <TooltipContent
            id={errorId}
            side="bottom"
            className={styles.errorTip}
          >
            Use a hex color: #RRGGBB, or #RRGGBBAA with alpha.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
