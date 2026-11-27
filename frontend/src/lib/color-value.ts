// A token's color is stored as #RRGGBB, or #RRGGBBAA when it's see-through. The panel
// shows it as a 6-digit hex and an opacity, so the hex reads the same everywhere.

const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;

/** "#64748B4D" → { hex: "#64748B", opacity: 30 }; anything else has no hex. */
export function splitColor(value: string): {
  hex: string | null;
  opacity: number;
} {
  const match = HEX.exec(value);
  if (!match?.[1]) return { hex: null, opacity: 100 };
  const alpha = match[2] === undefined ? 255 : Number.parseInt(match[2], 16);
  return {
    hex: `#${match[1].toUpperCase()}`,
    opacity: Math.round((alpha / 255) * 100),
  };
}

/** "#64748B" at 30 → "#64748B4D"; fully opaque stays 6 digits. */
export function joinColor(hex: string, opacity: number): string {
  const rgb = hex.toUpperCase();
  if (opacity >= 100) return rgb;
  const alpha = Math.round((Math.max(0, opacity) / 100) * 255);
  return rgb + alpha.toString(16).padStart(2, "0").toUpperCase();
}
