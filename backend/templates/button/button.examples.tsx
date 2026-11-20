// Usage reference for Button. The preview renders these, and they ship next to
// the generated button.tsx. Layout classes are stock Tailwind on purpose: the
// generator rewrites them onto the design tokens, like the component itself.
import type { ReactNode, SVGProps } from "react";
import { Button } from "./button";

// Inline icon so the examples don't depend on an icon library.
function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export const examples: { name: string; render: () => ReactNode }[] = [
  {
    name: "Variants",
    render: () => (
      <Row>
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </Row>
    ),
  },
  {
    name: "Sizes",
    render: () => (
      <Row>
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large</Button>
      </Row>
    ),
  },
  {
    name: "Icon only",
    render: () => (
      <Row>
        <Button size="icon-xs" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon-sm" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon" aria-label="Add">
          <PlusIcon />
        </Button>
        <Button size="icon-lg" aria-label="Add">
          <PlusIcon />
        </Button>
      </Row>
    ),
  },
  {
    name: "With icon",
    render: () => (
      <Row>
        <Button>
          <PlusIcon data-icon="inline-start" />
          New file
        </Button>
        <Button variant="outline">
          Next
          <PlusIcon data-icon="inline-end" />
        </Button>
      </Row>
    ),
  },
  {
    name: "States",
    render: () => (
      <Row>
        <Button disabled>Disabled</Button>
        <Button disabled focusableWhenDisabled>
          Disabled, focusable
        </Button>
      </Row>
    ),
  },
  {
    name: "As a link",
    render: () => (
      <Row>
        <Button render={<a href="#as-a-link" />} nativeButton={false}>
          Go to docs
        </Button>
      </Row>
    ),
  },
];
