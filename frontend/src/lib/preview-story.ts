import type { PreviewReadyMessage, StoryInfo } from "@dsg/design-data/types";

/** The story the frame shows for `name`: that one, or its first if it doesn't know the name. */
export const shownStory = (
  info: PreviewReadyMessage,
  name: string,
): StoryInfo | undefined =>
  info.stories.find((s) => s.name === name) ?? info.stories[0];
