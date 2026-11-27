import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { joinColor, splitColor } from "@/lib/color-value";
import * as styles from "@/styles/workspace.styles";

interface ColorFieldProps {
  label: string;
  /** A hex color, #RRGGBB or #RRGGBBAA (see-through). */
  value: string;
  onChange: (value: string) => void;
}

/** 6 digits only: #ff0 is valid CSS too, and would flash the button yellow mid-typing. */
const HEX = /^#[0-9a-f]{6}$/i;
const isOpacity = (text: string) =>
  /^\d{1,3}$/.test(text) && Number(text) <= 100;

/**
 * A color picker, the color as a 6-digit hex, and its opacity in percent. Typed values
 * apply once they're valid; until then the hex shows an error tooltip.
 */
export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const id = useId();
  const errorId = useId();
  // What's typed, until it's valid or the field loses focus.
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const [opacityDraft, setOpacityDraft] = useState<string | null>(null);
  const invalid = hexDraft !== null && !HEX.test(hexDraft);

  const { hex, opacity } = splitColor(value);
  // A new color on a fully transparent value would stay invisible, so it comes in opaque.
  const setColor = (next: string) =>
    onChange(joinColor(next, opacity === 0 ? 100 : opacity));

  return (
    <div className={styles.controlField}>
      <Label htmlFor={id}>{label}</Label>
      <div className={styles.colorRow}>
        <input
          type="color"
          aria-label={`${label}: pick a color`}
          value={(hex ?? "#000000").toLowerCase()}
          onChange={(e) => setColor(e.target.value)}
          // Nothing to show when it's fully transparent: crossed out, not black.
          className={
            hex === null || opacity === 0 ? styles.swatchUnset : styles.swatch
          }
        />
        <Tooltip open={invalid}>
          <TooltipTrigger
            render={
              <Input
                id={id}
                value={hexDraft ?? hex ?? ""}
                spellCheck={false}
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                onChange={(e) => {
                  const next = e.target.value;
                  setHexDraft(next);
                  if (HEX.test(next)) setColor(next);
                }}
                onBlur={() => setHexDraft(null)}
              />
            }
          />
          <TooltipContent
            id={errorId}
            side="bottom"
            className={styles.errorTip}
          >
            Use a 6-digit hex color, like #64748B.
          </TooltipContent>
        </Tooltip>
        <div className={styles.opacityField}>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            aria-label={`${label} opacity, in percent`}
            value={opacityDraft ?? String(opacity)}
            aria-invalid={opacityDraft !== null && !isOpacity(opacityDraft)}
            onChange={(e) => {
              const next = e.target.value;
              setOpacityDraft(next);
              if (hex && isOpacity(next))
                onChange(joinColor(hex, Number(next)));
            }}
            onBlur={() => setOpacityDraft(null)}
            className={styles.opacityInput}
          />
          <span aria-hidden="true" className={styles.opacitySuffix}>
            %
          </span>
        </div>
      </div>
    </div>
  );
}
