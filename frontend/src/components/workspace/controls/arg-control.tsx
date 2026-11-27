import type { StoryControl } from "@dsg/design-data/types";
import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as styles from "@/styles/workspace.styles";
import { ScaleSlider } from "./scale-slider";

interface ArgControlProps {
  control: StoryControl;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}

/** One arg's widget: a slider for a scale like Size, else a dropdown, a checkbox or a text field. */
export function ArgControl({ control, value, onChange }: ArgControlProps) {
  const id = useId();

  if (control.type === "boolean") {
    return (
      <Label className={styles.checkboxField}>
        <Checkbox
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
        {control.label}
      </Label>
    );
  }

  // A size knows each option's height (the preview adds them), so it's a scale.
  const details = control.type === "select" ? control.details : undefined;
  if (
    control.type === "select" &&
    details &&
    control.options.every((o) => details[o])
  ) {
    return (
      <ScaleSlider
        label={control.label}
        steps={control.options.map((option) => ({
          value: option,
          text: `${option} · ${details[option]}`,
          size: details[option] ?? "",
        }))}
        value={String(value ?? "")}
        onChange={onChange}
      />
    );
  }

  // Any other select: a dropdown, each option with its detail if it has one.
  const items =
    control.type === "select"
      ? control.options.map((option) => {
          const detail = control.details?.[option];
          return {
            value: option,
            label: detail ? `${option} · ${detail}` : option,
          };
        })
      : [];

  return (
    <div className={styles.controlField}>
      <Label htmlFor={id}>{control.label}</Label>
      {control.type === "select" ? (
        <Select
          items={items}
          value={String(value ?? "")}
          onValueChange={(next) => {
            if (next !== null) onChange(next);
          }}
        >
          <SelectTrigger id={id} className={styles.selectTrigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
