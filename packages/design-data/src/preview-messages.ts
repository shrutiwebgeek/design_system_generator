// Checks for the preview protocol (types in types.ts). Each side runs them on what the
// other one sends, because anything can post a message to a window.
import type {
  ComponentTokenInfo,
  PreviewModeMessage,
  PreviewReadyMessage,
  PreviewSelectMessage,
  StoryArgs,
  StoryControl,
  StoryInfo,
  TokenValues,
} from "./types.ts";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === "string");

const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === "string";

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) && Object.values(value).every((v) => typeof v === "string");

const isOptionalStringRecord = (value: unknown): boolean =>
  value === undefined || isStringRecord(value);

export const isStoryArgs = (value: unknown): value is StoryArgs =>
  isRecord(value) &&
  Object.values(value).every(
    (v) => typeof v === "string" || typeof v === "boolean",
  );

export const isStoryControl = (value: unknown): value is StoryControl =>
  isRecord(value) &&
  typeof value.label === "string" &&
  (value.type === "boolean" ||
    value.type === "text" ||
    (value.type === "select" &&
      isStrings(value.options) &&
      isOptionalString(value.prop) &&
      isOptionalStringRecord(value.details)));

const isStoryInfo = (value: unknown): value is StoryInfo =>
  isRecord(value) &&
  typeof value.name === "string" &&
  isStrings(value.controls) &&
  isOptionalString(value.variant);

const isOption = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.name === "string" &&
  typeof value.value === "string";

const isTokenInfo = (value: unknown): value is ComponentTokenInfo =>
  isRecord(value) &&
  typeof value.key === "string" &&
  typeof value.cssVar === "string" &&
  typeof value.label === "string" &&
  (value.kind === "color" ||
    value.kind === "radius" ||
    value.kind === "borderWidth") &&
  isOptionalString(value.variant) &&
  isStringRecord(value.values) &&
  (value.options === undefined ||
    (Array.isArray(value.options) && value.options.every(isOption)));

export const isTokenValues = (value: unknown): value is TokenValues =>
  isRecord(value) && Object.values(value).every(isStringRecord);

export const isReadyMessage = (data: unknown): data is PreviewReadyMessage =>
  isRecord(data) &&
  data.type === "dsg-preview:ready" &&
  Array.isArray(data.stories) &&
  data.stories.every(isStoryInfo) &&
  isStoryArgs(data.args) &&
  isRecord(data.controls) &&
  Object.values(data.controls).every(isStoryControl) &&
  Array.isArray(data.tokens) &&
  data.tokens.every(isTokenInfo) &&
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
  typeof data.mode === "string" &&
  isStoryArgs(data.args) &&
  isTokenValues(data.tokenValues);
