// Test helpers. compileTailwind lives in theme/ because the preview uses it in production.
export { compileTailwind } from "./theme/compile-tailwind.ts";

/** The first CSS rule for a plain class selector, or undefined. */
export function ruleFor(css: string, className: string): string | undefined {
  const escaped = className.replace(/[-.[\]()=:&*'/!]/g, (c) => "\\" + c);
  return new RegExp(`\\.${escaped} \\{[^}]*\\}`).exec(css)?.[0];
}
