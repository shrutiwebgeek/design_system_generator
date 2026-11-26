import type { ComponentSummary } from "@dsg/design-data/types";
import type { UseQueryResult } from "@tanstack/react-query";
import { SwatchBookIcon } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOpenFolders } from "@/hooks/use-open-folders";
import { matches, TIERS, type Selection } from "@/lib/component-catalog";
import * as styles from "@/styles/sidebar.styles";
import { SidebarSearch } from "./sidebar-search";
import { TierFolder } from "./tier-folder";
import { Branch, TreeFolder } from "./tree-folder";

interface SelectionProps {
  selected: Selection | undefined;
  onSelect: (selection: Selection) => void;
}

interface ComponentSidebarProps extends SelectionProps {
  components: UseQueryResult<ComponentSummary[]>;
  /** Hidden, not unmounted, in full screen: open folders and the search survive. */
  hidden: boolean;
}

/** The left column, with its loading and error states. */
export function ComponentSidebar({
  components,
  hidden,
  ...selection
}: ComponentSidebarProps) {
  return (
    <aside aria-label="Explorer" hidden={hidden} className={styles.sidebar}>
      <ScrollArea className="h-full">
        {components.isPending && (
          <p className={styles.loading}>Loading components…</p>
        )}
        {components.isError && (
          <p role="alert" className={styles.error}>
            {components.error.message}
          </p>
        )}
        {components.data && (
          <ComponentTree components={components.data} {...selection} />
        )}
      </ScrollArea>
    </aside>
  );
}

interface ComponentTreeProps extends SelectionProps {
  components: ComponentSummary[];
}

/**
 * Design system → tier folders → component folders → story files.
 * Search filters components by name and opens every folder on the way to a match.
 */
function ComponentTree({ components, selected, onSelect }: ComponentTreeProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const searching = q !== "";
  const folder = useOpenFolders(components, selected, searching);

  const visible = searching
    ? components.filter((c) => matches(c, q))
    : components;
  const tiers = TIERS.map((t) => ({
    ...t,
    components: visible.filter((c) => c.tier === t.tier),
  })).filter((t) => !searching || t.components.length > 0);

  return (
    <div className={styles.content}>
      <SidebarSearch query={query} onQueryChange={setQuery} />
      <nav aria-label="Components">
        <TreeFolder
          kind="category"
          icon={<SwatchBookIcon />}
          label="Design system"
          {...folder("design-system")}
        >
          {tiers.length === 0 ? (
            <p className={styles.noMatch}>
              No component matches “{query.trim()}”.
            </p>
          ) : (
            <Branch>
              {tiers.map((tier) => (
                <li key={tier.tier}>
                  <TierFolder
                    {...tier}
                    folder={folder}
                    selected={selected}
                    onSelect={onSelect}
                  />
                </li>
              ))}
            </Branch>
          )}
        </TreeFolder>
      </nav>
    </div>
  );
}
