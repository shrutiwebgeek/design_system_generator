import type {
  ComponentTokenInfo,
  PreviewReadyMessage,
  StoryArgs,
  StoryInfo,
} from "@dsg/design-data/types";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { currentValue, scopeOf, type TokenEdits } from "@/lib/token-edits";
import { note } from "@/styles/atoms";
import * as styles from "@/styles/workspace.styles";
import { ArgControl } from "./arg-control";
import { TokenControl } from "./token-control";

interface ControlsPanelProps {
  /** What the preview reported; null until it has loaded. */
  info: PreviewReadyMessage | null;
  story: StoryInfo | undefined;
  args: StoryArgs | undefined;
  onArgsChange: (args: StoryArgs) => void;
  /** The mode on screen: color edits apply to it. */
  mode: string | undefined;
  tokens: {
    edits: TokenEdits;
    edit: (key: string, scope: string, value: string) => void;
    reset: () => void;
  };
}

/** The right column: the only place a designer changes the component. */
export function ControlsPanel({
  info,
  story,
  args,
  onArgsChange,
  mode,
  tokens,
}: ControlsPanelProps) {
  if (!info || !story || !args || !mode)
    return (
      <Panel>
        <p className={note}>Loading controls…</p>
      </Panel>
    );

  const colors = info.tokens.filter((t) => t.variant === story.variant);
  const shape = info.tokens.filter((t) => t.variant === undefined);
  const tokenControl = (token: ComponentTokenInfo) => (
    <TokenControl
      key={token.key}
      token={token}
      value={currentValue(token, tokens.edits, mode)}
      onChange={(value) => tokens.edit(token.key, scopeOf(token, mode), value)}
    />
  );

  return (
    <Panel>
      <Section title="Props">
        {Object.entries(info.controls)
          .filter(([name]) => story.controls.includes(name))
          .map(([name, control]) => (
            <ArgControl
              key={name}
              control={control}
              value={args[name]}
              onChange={(value) => onArgsChange({ ...args, [name]: value })}
            />
          ))}
      </Section>
      {colors.length > 0 && (
        <Section title="Colors">{colors.map(tokenControl)}</Section>
      )}
      {shape.length > 0 && (
        <Section title="Shape">{shape.map(tokenControl)}</Section>
      )}
      {Object.keys(tokens.edits).length > 0 && (
        <Button variant="outline" size="sm" onClick={tokens.reset}>
          Reset colors and shape
        </Button>
      )}
    </Panel>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <aside aria-label="Controls" className={styles.controls}>
      <h2 className={styles.controlsTitle}>Controls</h2>
      {children}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className={styles.controlSection}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}
