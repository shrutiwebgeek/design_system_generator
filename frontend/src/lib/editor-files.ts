import type { GenerateResponse } from "@dsg/design-data/types";

export interface EditorFile {
  name: string;
  code: string;
}

const testFileOf = (source: string): string => `${source}.test.tsx`;

/**
 * Code tab: the component's own files. The test has its own tab, and the shared
 * files (theme.css, lib/utils.ts, dependencies.json) only come with the download.
 */
export function codeFiles({ source, files }: GenerateResponse): EditorFile[] {
  const testFile = testFileOf(source);
  return Object.entries(files)
    .filter(([name]) => name !== testFile)
    .map(([name, code]) => ({ name, code }));
}

/** Tests tab: the predefined test, when the template has one. */
export function testFiles({ source, files }: GenerateResponse): EditorFile[] {
  const name = testFileOf(source);
  const code = files[name];
  return code === undefined ? [] : [{ name, code }];
}
