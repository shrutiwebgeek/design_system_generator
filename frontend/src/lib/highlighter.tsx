import type { CSSProperties } from "react";
import {
  createHighlighterCore,
  type GrammarState,
  type HighlighterCore,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

/**
 * tsx is the only grammar: the editor shows nothing else. ansi colors the terminal
 * log and needs no grammar, it's built into Shiki. To add a language, import its
 * grammar in `langs` below and add its name here.
 */
export type HighlightLanguage = "tsx" | "ansi";

// The code view is a VS Code Dark+ editor whatever the app's mode, so both slots
// of the light/dark pair use Dark+ (shadcn ships github-light / github-dark here).
const EDITOR_THEME = "dark-plus";

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [import("shiki/themes/dark-plus.mjs")],
    langs: [import("shiki/langs/tsx.mjs")],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return highlighter;
}

export async function loadHighlighter(lang: HighlightLanguage) {
  const shiki = await getHighlighter();

  return {
    // Returns one React node per line, and the grammar state after the last
    // line. Pass that state back to continue where the code left off.
    highlight(code: string, state?: GrammarState) {
      const tokenize = (text: string) =>
        shiki.codeToTokens(text, {
          lang,
          themes: { light: EDITOR_THEME, dark: EDITOR_THEME },
          defaultColor: false,
          grammarState: state,
        }).tokens;

      // ANSI has no grammar state, so each line is tokenized on its own and
      // gets the same colors whether it arrives in one piece or streams.
      const tokens =
        lang === "ansi" ? code.split("\n").flatMap(tokenize) : tokenize(code);

      return {
        lines: tokens.map((line) =>
          line.map((token, index) => (
            <span
              key={index}
              style={token.htmlStyle as CSSProperties}
              className="text-(--shiki-light) dark:text-(--shiki-dark)"
            >
              {token.content}
            </span>
          )),
        ),
        state: shiki.getLastGrammarState(tokens),
      };
    },
  };
}
