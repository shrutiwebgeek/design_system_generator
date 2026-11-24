import { cn } from "@/lib/utils";
import { focusRing, heading } from "./atoms";

export const navbar = "flex h-14 shrink-0 items-center border-b px-4";
export const home = cn(
  heading,
  focusRing,
  "flex items-center gap-2 rounded-md text-lg",
  "focus-visible:outline-offset-2",
);
