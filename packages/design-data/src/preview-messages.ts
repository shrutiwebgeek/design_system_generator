// Checks for the preview protocol (types in types.ts). Each side runs them on what the
// other one sends, because anything can post a message to a window.
import type {
  PreviewModeMessage,
  PreviewReadyMessage,
  PreviewSelectMessage,
  TokenValues,
} from "./types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((v) => typeof v === "string");

export const isTokenValues = (value: unknown): value is TokenValues =>
  isRecord(value) && Object.values(value).every(isStringRecord);

export const isReadyMessage = (data: unknown): data is PreviewReadyMessage =>
  isRecord(data) &&
  data.type === "dsg-preview:ready" &&
  isStrings(data.stories) &&
  isStrings(data.modes) &&
  typeof data.defaultMode === "string" &&
  typeof data.mode === "string";

export const isModeMessage = (data: unknown): data is PreviewModeMessage =>
  isRecord(data) &&
  data.type === "dsg-preview:mode" &&
  typeof data.mode === "string";

export const isSelectMessage = (data: unknown): data is PreviewSelectMessage =>
  isRecord(data) &&
  data.type === "dsg-preview:select" &&
  typeof data.story === "string" &&
  typeof data.mode === "string";
