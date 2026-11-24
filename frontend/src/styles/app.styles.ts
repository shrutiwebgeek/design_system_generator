import { cn } from "@/lib/utils";
import { center, column, fill, note } from "./atoms";

export const app = cn(column, "h-svh");
export const body = cn("flex", fill);
export const empty = cn(center, note, "flex-1");

/** Fills whatever failed, and inherits its text color so it reads on dark panels too. */
export const errorFallback = cn(center, "size-full flex-col gap-3 p-4 text-sm");
