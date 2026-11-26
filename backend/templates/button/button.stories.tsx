// Stories for Button: one button each, one per variant, plus an icon button and a
// button with an icon. The preview shows them, the Controls panel changes their
// args, and they ship next to the generated button.tsx as a usage reference.
import type { ComponentProps, ReactNode, SVGProps } from "react";
import { Button } from "./button";

type ButtonProps = ComponentProps<typeof Button>;

/** What the Controls panel can change. One change reaches every story. */
export interface Args {
  size?: ButtonProps["size"];
  iconSize?: ButtonProps["size"];
  disabled?: boolean;
  children?: string;
}

/** What a story fixes: not in the Controls panel. */
export type StoryProps = Pick<ButtonProps, "variant">;

export const controls = {
  size: {
    type: "select",
    label: "Size",
    options: ["default", "xs", "sm", "lg"],
  },
  iconSize: {
    type: "select",
    label: "Icon size",
    prop: "size",
    options: ["icon", "icon-xs", "icon-sm", "icon-lg"],
  },
  disabled: { type: "boolean", label: "Disabled" },
  children: { type: "text", label: "Text" },
} as const;

/** Where every story starts. */
export const args: Args = {
  size: "default",
  iconSize: "icon",
  disabled: false,
  children: "Button",
};

// Inline icon so the stories don't depend on an icon library.
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

/** How a story draws its button, unless it draws its own. */
export const render = (
  { size, disabled, children }: Args,
  props: StoryProps,
): ReactNode => (
  <Button {...props} size={size} disabled={disabled}>
    {children}
  </Button>
);

const withText: (keyof Args)[] = ["size", "disabled", "children"];

export const stories: {
  name: string;
  props: StoryProps;
  controls: (keyof Args)[];
  render?: (args: Args, props: StoryProps) => ReactNode;
}[] = [
  { name: "Default", props: { variant: "default" }, controls: withText },
  { name: "Secondary", props: { variant: "secondary" }, controls: withText },
  { name: "Outline", props: { variant: "outline" }, controls: withText },
  { name: "Ghost", props: { variant: "ghost" }, controls: withText },
  {
    name: "Destructive",
    props: { variant: "destructive" },
    controls: withText,
  },
  { name: "Link", props: { variant: "link" }, controls: withText },
  {
    name: "Icon",
    props: { variant: "default" },
    // No text: an icon button's name is its aria-label.
    controls: ["iconSize", "disabled"],
    render: ({ iconSize, disabled }, props) => (
      <Button {...props} size={iconSize} disabled={disabled} aria-label="Add">
        <PlusIcon />
      </Button>
    ),
  },
  {
    name: "With icon",
    props: { variant: "default" },
    controls: withText,
    render: ({ size, disabled, children }, props) => (
      <Button {...props} size={size} disabled={disabled}>
        <PlusIcon data-icon="inline-start" />
        {children}
      </Button>
    ),
  },
];
