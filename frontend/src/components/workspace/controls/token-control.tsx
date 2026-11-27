import type { ComponentTokenInfo } from "@dsg/design-data/types";
import { ColorField } from "./color-field";
import { ScaleSlider } from "./scale-slider";

interface TokenControlProps {
  token: ComponentTokenInfo;
  value: string;
  onChange: (value: string) => void;
}

/** One component token: a color, or a slider over the radius or border-thickness scale. */
export function TokenControl({ token, value, onChange }: TokenControlProps) {
  if (token.kind === "color")
    return <ColorField label={token.label} value={value} onChange={onChange} />;

  return (
    <ScaleSlider
      label={token.label}
      steps={(token.options ?? []).map((o) => ({
        value: o.value,
        text: `${o.name} · ${o.value}`,
        size: o.value,
      }))}
      value={value}
      onChange={onChange}
    />
  );
}
