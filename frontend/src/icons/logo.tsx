import type { SVGProps } from "react";

/** Placeholder mark until there's a real logo: three tiles, atoms to organisms. */
export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="16" height="16" rx="4" fill="var(--secondary)" />
      <rect x="8" y="8" width="16" height="16" rx="4" fill="var(--accent)" />
      <rect x="14" y="14" width="16" height="16" rx="4" fill="var(--primary)" />
    </svg>
  );
}
