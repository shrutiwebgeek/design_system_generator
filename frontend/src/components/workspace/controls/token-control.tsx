import type { ComponentTokenInfo } from "@dsg/design-data/types";
import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as styles from "@/styles/workspace.styles";
import { ColorField } from "./color-field";

interface TokenControlProps {
  token: ComponentTokenInfo;
  value: string;
  onChange: (value: string) => void;
}

/** One component token: a color, or a step on the radius or border-thickness scale. */
export function TokenControl({ token, value, onChange }: TokenControlProps) {
  const id = useId();
  if (token.kind === "color")
    return <ColorField label={token.label} value={value} onChange={onChange} />;

  const items = (token.options ?? []).map((o) => ({
    label: `${o.name} · ${o.value}`,
    value: o.value,
  }));
  return (
    <div className={styles.controlField}>
      <Label htmlFor={id}>{token.label}</Label>
      <Select
        items={items}
        value={value}
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
    </div>
  );
}
