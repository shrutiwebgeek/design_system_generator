import type { ComponentSummary, Tier } from "@dsg/design-data/types";
import { FileCode2Icon, FolderDotIcon, HourglassIcon } from "lucide-react";
import type { FolderState } from "@/hooks/use-open-folders";
import {
  isReady,
  type ReadyComponent,
  type Selection,
} from "@/lib/component-catalog";
import { iconSm } from "@/styles/atoms";
import * as styles from "@/styles/sidebar.styles";
import { Branch, TreeFolder } from "./tree-folder";

interface TreeProps {
  folder: FolderState;
  selected: Selection | undefined;
  onSelect: (selection: Selection) => void;
}

interface TierFolderProps extends TreeProps {
  tier: Tier;
  label: string;
  components: ComponentSummary[];
}

/** A tier: its ready components, then the rest under "In progress". */
export function TierFolder({
  tier,
  label,
  components,
  ...tree
}: TierFolderProps) {
  const inProgress = components.filter((c) => !isReady(c));
  return (
    <TreeFolder label={label} {...tree.folder(`tier:${tier}`)}>
      <Branch>
        {components.filter(isReady).map((component) => (
          <li key={component.label}>
            <ComponentFolder component={component} {...tree} />
          </li>
        ))}
        {inProgress.length > 0 && (
          <li>
            <TreeFolder
              kind="group"
              icon={<HourglassIcon />}
              label={<>In progress ({inProgress.length})</>}
              {...tree.folder(`in-progress:${tier}`)}
            >
              <InProgressList components={inProgress} />
            </TreeFolder>
          </li>
        )}
      </Branch>
    </TreeFolder>
  );
}

interface ComponentFolderProps extends TreeProps {
  component: ReadyComponent;
}

/** A ready component: one file per example. */
function ComponentFolder({
  component: { source, label, examples },
  folder,
  selected,
  onSelect,
}: ComponentFolderProps) {
  return (
    <TreeFolder label={label} {...folder(`component:${source}`)}>
      <Branch>
        {examples.map((example) => {
          const current =
            selected?.source === source && selected.example === example;
          return (
            <li key={example}>
              <button
                type="button"
                aria-current={current ? "page" : undefined}
                onClick={() => onSelect({ source, example })}
                className={styles.exampleFile}
              >
                <FileCode2Icon
                  aria-hidden="true"
                  className={styles.exampleFileIcon}
                />
                <span className="truncate">{example}</span>
              </button>
            </li>
          );
        })}
      </Branch>
    </TreeFolder>
  );
}

/** Not-ready components: listed, not clickable. */
function InProgressList({ components }: { components: ComponentSummary[] }) {
  return (
    <Branch>
      {components.map(({ label, description }) => (
        <li key={label} title={description} className={styles.inProgressItem}>
          <FolderDotIcon aria-hidden="true" className={iconSm} />
          {label}
        </li>
      ))}
    </Branch>
  );
}
