// Hex colors with alpha, and mixing in oklch the way CSS color-mix() does, so the
// generator can write a default like "secondary mixed with 5% foreground" as one hex.

type Rgb = [number, number, number];
type Lab = [number, number, number];

const HEX = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i;

function parseHex(hex: string): { rgb: Rgb; alpha: string } {
  const match = HEX.exec(hex);
  if (!match?.[1])
    throw new Error(`Expected a 6- or 8-digit hex color, got "${hex}"`);
  const digits = match[1];
  const channel = (i: number) => parseInt(digits.slice(i, i + 2), 16) / 255;
  return { rgb: [channel(0), channel(2), channel(4)], alpha: match[2] ?? "" };
}

const toHex = ([r, g, b]: Rgb): string =>
  "#" +
  [r, g, b]
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, c)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();

/** "#64748B" at 30% → "#64748B4D". The color stays; only the alpha byte is set. */
export function withAlpha(hex: string, percent: number): string {
  const { rgb } = parseHex(hex);
  const alpha = Math.round((percent / 100) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return toHex(rgb) + alpha;
}

// sRGB ↔ OKLab, from Björn Ottosson's reference (the matrices CSS Color 4 uses).
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

function rgbToOklab([r, g, b]: Rgb): Lab {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/**
 * color-mix(in oklch, base, other <percent>%): lightness and chroma blend linearly,
 * hue takes the shorter way round. Both colors opaque.
 */
export function mixOklch(base: string, other: string, percent: number): string {
  const t = percent / 100;
  const polar = (hex: string) => {
    const [L, a, b] = rgbToOklab(parseHex(hex).rgb);
    return { L, C: Math.hypot(a, b), h: (Math.atan2(b, a) * 180) / Math.PI };
  };
  const p = polar(base);
  const q = polar(other);
  let dh = q.h - p.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const L = p.L + (q.L - p.L) * t;
  const C = p.C + (q.C - p.C) * t;
  const h = ((p.h + dh * t) * Math.PI) / 180;
  return toHex(oklabToRgb([L, C * Math.cos(h), C * Math.sin(h)]));
}
