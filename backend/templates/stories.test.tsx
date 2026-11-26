// Every template's stories must render and describe their controls correctly: they
// power the preview and the Controls panel, and ship as a usage reference. Runs
// against the raw templates.
import { isStoryArgs, isStoryControl } from "@dsg/design-data/preview-messages";
import type { StoryArgs, StoryControl } from "@dsg/design-data/types";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { storyNamesIn } from "../src/generator/story-names.ts";
import { TEMPLATES_DIR, templatesWith } from "../src/generator/templates.ts";

type StoryProps = Record<string, unknown>;

interface StoriesModule {
  stories: {
    name: string;
    props?: StoryProps;
    controls: string[];
    render?: (args: StoryArgs, props: StoryProps) => ReactNode;
  }[];
  args: StoryArgs;
  controls: Record<string, StoryControl>;
  render: (args: StoryArgs, props: StoryProps) => ReactNode;
}

const loadStories = (name: string): Promise<StoriesModule> =>
  import(`./${name}/${name}.stories.tsx`);

const readTemplate = (name: string, file: string) =>
  readFileSync(join(TEMPLATES_DIR, name, file), "utf8");

const keyOf = (p: ts.ObjectLiteralElementLike): string =>
  p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))
    ? p.name.text
    : "";

/** The variant groups in a component's cva() call and their option names, read without running it. */
function cvaVariantsIn(code: string): Record<string, string[]> {
  const found: Record<string, string[]> = {};
  const visit = (node: ts.Node): void => {
    const config = ts.isCallExpression(node) ? node.arguments[1] : undefined;
    if (
      ts.isCallExpression(node) &&
      node.expression.getText() === "cva" &&
      config &&
      ts.isObjectLiteralExpression(config)
    ) {
      const variants = config.properties.find((p) => keyOf(p) === "variants");
      if (variants && ts.isPropertyAssignment(variants))
        for (const group of ts.isObjectLiteralExpression(variants.initializer)
          ? variants.initializer.properties
          : [])
          if (
            ts.isPropertyAssignment(group) &&
            ts.isObjectLiteralExpression(group.initializer)
          )
            found[keyOf(group)] = group.initializer.properties.map(keyOf);
    }
    ts.forEachChild(node, visit);
  };
  visit(ts.createSourceFile("c.tsx", code, ts.ScriptTarget.Latest, true));
  return found;
}

const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

describe.each(templatesWith((name) => `${name}.stories.tsx`))(
  "%s stories",
  (name) => {
    it("exports a non-empty list of uniquely named stories", async () => {
      const { stories } = await loadStories(name);
      expect(stories.length).toBeGreaterThan(0);
      expect(new Set(stories.map((s) => s.name)).size).toBe(stories.length);
    });

    it("names its stories with literals the tool can read without running them", async () => {
      // The sidebar lists these names before any preview is built.
      const { stories } = await loadStories(name);
      const code = readTemplate(name, `${name}.stories.tsx`);
      expect(storyNamesIn(code)).toEqual(stories.map((s) => s.name));
    });

    it("renders every story with the shared args", async () => {
      const module = await loadStories(name);
      for (const story of module.stories) {
        const draw = story.render ?? module.render;
        const { container, unmount } = render(
          <>{draw(module.args, story.props ?? {})}</>,
        );
        expect(container.childElementCount, story.name).toBeGreaterThan(0);
        unmount();
      }
    });

    it("gives every arg a control its value fits, and stories only controls that exist", async () => {
      // These cross to the tool by postMessage, so they must pass its checks.
      const { stories, args, controls } = await loadStories(name);
      expect(isStoryArgs(args)).toBe(true);
      for (const control of Object.values(controls))
        expect(isStoryControl(control)).toBe(true);
      for (const [arg, value] of Object.entries(args)) {
        const control = controls[arg];
        expect(control, arg).toBeDefined();
        if (control?.type === "select")
          expect(control.options, arg).toContain(value);
        else
          expect(typeof value, arg).toBe(
            control?.type === "boolean" ? "boolean" : "string",
          );
      }
      for (const story of stories)
        for (const arg of story.controls)
          expect(Object.keys(args), `${story.name}: ${arg}`).toContain(arg);
    });

    it("covers the component's variants exactly: its selects, and a story per variant", async () => {
      const { stories, controls } = await loadStories(name);
      const code = readTemplate(name, `${name}.tsx`);
      const variants = cvaVariantsIn(code);
      // Otherwise a reader that finds nothing would pass every template.
      if (code.includes("cva("))
        expect(Object.keys(variants).length).toBeGreaterThan(0);
      for (const [group, options] of Object.entries(variants)) {
        // Selects that set this prop, e.g. both Size and Icon size set `size`.
        const selects = Object.entries(controls).flatMap(([arg, control]) =>
          control.type === "select" && (control.prop ?? arg) === group
            ? control.options
            : [],
        );
        const fixed = stories.flatMap((s) => {
          const value = s.props?.[group];
          return typeof value === "string" ? [value] : [];
        });
        if (selects.length > 0)
          expect(sorted(selects), `${group} selects`).toEqual(sorted(options));
        if (fixed.length > 0)
          expect(sorted(fixed), `${group} stories`).toEqual(sorted(options));
      }
    });
  },
);
