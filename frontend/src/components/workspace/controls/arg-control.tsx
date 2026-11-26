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

interface ArgControlProps {
  control: StoryControl;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}

/** One arg's widget: a dropdown, a checkbox or a text field. */
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

  // A size reads "xs · 24px": the preview adds each option's height.
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
