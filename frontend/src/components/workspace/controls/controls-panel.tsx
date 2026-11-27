import type {
  ComponentTokenInfo,
  PreviewReadyMessage,
  StoryArgs,
  StoryInfo,
} from "@dsg/design-data/types";
import { RotateCcwIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  currentValue,
  isEdited,
  scopeOf,
  type TokenEdits,
} from "@/lib/token-edits";
import { note } from "@/styles/atoms";
import * as styles from "@/styles/workspace.styles";
import { IconTip } from "../icon-tip";
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
    reset: (keys: string[], scope: string) => void;
  };
}

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

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
  const keysOf = (list: ComponentTokenInfo[]) => list.map((t) => t.key);
  const tokenControl = (token: ComponentTokenInfo) => (
    <TokenControl
      key={token.key}
      token={token}
      value={currentValue(token, tokens.edits, mode)}
      onChange={(value) => tokens.edit(token.key, scopeOf(token, mode), value)}
    />
  );
  const others = info.modes.filter((m) => m !== mode);
  const otherPalette =
    others.length === 1
      ? `To edit the ${others[0]} mode palette, switch the preview to ${others[0]} mode.`
      : "To edit another palette, switch the preview's mode.";

  return (
    <Panel note="Props and borders stay the same in every story, only colors are set per story.">
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
        <Section
          title="Colors"
          note={`${capitalize(mode)} mode palette displayed. ${otherPalette}`}
          action={
            <ResetButton
              label={`Reset ${story.variant ?? ""} colors (${mode} mode)`}
              disabled={!isEdited(tokens.edits, keysOf(colors), mode)}
              onReset={() => tokens.reset(keysOf(colors), mode)}
            />
          }
        >
          {colors.map(tokenControl)}
        </Section>
      )}
      {shape.length > 0 && (
        <Section
          title="Borders"
          action={
            <ResetButton
              label="Reset borders"
              disabled={!isEdited(tokens.edits, keysOf(shape), "*")}
              onReset={() => tokens.reset(keysOf(shape), "*")}
            />
          }
        >
          {shape.map(tokenControl)}
        </Section>
      )}
    </Panel>
  );
}

function Panel({
  note: text,
  children,
}: {
  note?: string;
  children: ReactNode;
}) {
  return (
    <aside aria-label="Controls" className={styles.controls}>
      <div className={styles.controlsHeader}>
        <h1 className={styles.controlsTitle}>Control Panel</h1>
        {text && <p className={styles.panelNote}>{text}</p>}
      </div>
      {children}
    </aside>
  );
}

interface SectionProps {
  title: string;
  /** Beside the title, on the right. */
  action?: ReactNode;
  /** Under the title. */
  note?: string;
  children: ReactNode;
}

function Section({ title, action, note: text, children }: SectionProps) {
  return (
    <section aria-label={title} className={styles.controlSection}>
      <div>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          {action}
        </div>
        {text && <p className={styles.sectionNote}>{text}</p>}
      </div>
      {children}
    </section>
  );
}

interface ResetButtonProps {
  label: string;
  disabled: boolean;
  onReset: () => void;
}

/** Disabled until there's something to reset, but still focusable, so its tooltip explains it. */
function ResetButton({ label, disabled, onReset }: ResetButtonProps) {
  return (
    <IconTip label={disabled ? `${label}: nothing changed yet` : label}>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={disabled}
        focusableWhenDisabled
        aria-label={label}
        onClick={onReset}
        className={styles.disabledIconButton}
      >
        <RotateCcwIcon aria-hidden="true" />
      </Button>
    </IconTip>
  );
}
