import type { ComponentSummary, Tier } from "@dsg/design-data/types";
import {
  ChevronRightIcon,
  FileCode2Icon,
  FolderDotIcon,
  FolderIcon,
  FolderOpenIcon,
  HourglassIcon,
  SearchIcon,
  SwatchBookIcon,
  XIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { isReady } from "./ready";

const TIERS: { tier: Tier; label: string }[] = [
  { tier: "atoms", label: "Atoms" },
  { tier: "molecules", label: "Molecules" },
  { tier: "organisms", label: "Organisms" },
];

export interface Selection {
  source: string;
  example: string;
}

interface Props {
  components: ComponentSummary[];
  selected: Selection | undefined;
  onSelect: (selection: Selection) => void;
}

const matches = (c: ComponentSummary, query: string) =>
  c.label.toLowerCase().includes(query) ||
  (c.source ?? "").toLowerCase().includes(query);

/**
 * The explorer: Design system → tier folders → component folders → example files.
 * Not-ready components stay listed under a collapsed "In progress" group per tier.
 * Search filters components by name and opens every folder on the way to a match.
 */
export function ComponentSidebar({ components, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const searching = q !== "";

  // Folders the user opened or closed. Starts with the path to the selection open.
  const [open, setOpen] = useState(() => {
    const start = components.find((c) => c.source === selected?.source);
    return new Set(
      [
        "design-system",
        start && `tier:${start.tier}`,
        start && `component:${start.source}`,
      ].filter((id): id is string => Boolean(id)),
    );
  });
  const folder = (id: string) => ({
    // While searching, every folder on the way to a match is open.
    open: searching || open.has(id),
    onOpenChange: (next: boolean) =>
      setOpen((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(id);
        else copy.delete(id);
        return copy;
      }),
  });

  const visible = searching
    ? components.filter((c) => matches(c, q))
    : components;

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Search components"
          placeholder="Search components"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setQuery("")}
          className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <XIcon aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </div>

      <nav aria-label="Components">
        <Collapsible {...folder("design-system")}>
          <FolderTrigger
            icon={<SwatchBookIcon />}
            className="text-xs font-semibold tracking-wide uppercase"
          >
            Design system
          </FolderTrigger>
          <CollapsibleContent>
            {visible.length === 0 ? (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                No component matches “{query.trim()}”.
              </p>
            ) : (
              <Branch>
                {TIERS.map(({ tier, label }) => {
                  const inTier = visible.filter((c) => c.tier === tier);
                  if (searching && inTier.length === 0) return null;
                  const ready = inTier.filter(isReady);
                  const inProgress = inTier.filter((c) => !isReady(c));
                  return (
                    <li key={tier}>
                      <Collapsible {...folder(`tier:${tier}`)}>
                        <FolderTrigger folder>{label}</FolderTrigger>
                        <CollapsibleContent>
                          <Branch>
                            {ready.map((c) => (
                              <li key={c.label}>
                                <Collapsible
                                  {...folder(`component:${c.source}`)}
                                >
                                  <FolderTrigger folder>
                                    {c.label}
                                  </FolderTrigger>
                                  <CollapsibleContent>
                                    <Branch>
                                      {c.examples.map((example) => (
                                        <li key={example}>
                                          <ExampleFile
                                            current={
                                              selected?.source === c.source &&
                                              selected.example === example
                                            }
                                            onClick={() =>
                                              onSelect({
                                                source: c.source!,
                                                example,
                                              })
                                            }
                                          >
                                            {example}
                                          </ExampleFile>
                                        </li>
                                      ))}
                                    </Branch>
                                  </CollapsibleContent>
                                </Collapsible>
                              </li>
                            ))}
                            {inProgress.length > 0 && (
                              <li>
                                <Collapsible {...folder(`in-progress:${tier}`)}>
                                  <FolderTrigger
                                    icon={<HourglassIcon />}
                                    className="text-muted-foreground"
                                  >
                                    In progress ({inProgress.length})
                                  </FolderTrigger>
                                  <CollapsibleContent>
                                    <Branch>
                                      {inProgress.map((c) => (
                                        <li
                                          key={c.label}
                                          title={c.description}
                                          className="flex items-center gap-1.5 py-1 ps-6 pe-2 text-sm text-muted-foreground"
                                        >
                                          <FolderDotIcon
                                            aria-hidden="true"
                                            className="size-4 shrink-0"
                                          />
                                          {c.label}
                                        </li>
                                      ))}
                                    </Branch>
                                  </CollapsibleContent>
                                </Collapsible>
                              </li>
                            )}
                          </Branch>
                        </CollapsibleContent>
                      </Collapsible>
                    </li>
                  );
                })}
              </Branch>
            )}
          </CollapsibleContent>
        </Collapsible>
      </nav>
    </div>
  );
}

/** One level deeper, with an indent guide. */
function Branch({ children }: { children: ReactNode }) {
  return (
    <ul className="ms-3.5 flex flex-col border-s border-border/70 ps-1">
      {children}
    </ul>
  );
}

/**
 * A disclosure row: chevron, icon, label. `folder` swaps a closed folder icon for
 * an open one; Base UI marks the trigger with data-panel-open when expanded.
 */
function FolderTrigger({
  children,
  icon,
  folder = false,
  className = "",
}: {
  children: ReactNode;
  icon?: ReactNode;
  folder?: boolean;
  className?: string;
}) {
  return (
    <CollapsibleTrigger
      className={`group flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:shrink-0 ${className}`}
    >
      <ChevronRightIcon
        aria-hidden="true"
        className="text-muted-foreground transition-transform group-data-panel-open:rotate-90"
      />
      {folder ? (
        <>
          <FolderIcon
            aria-hidden="true"
            className="text-ring group-data-panel-open:hidden"
          />
          <FolderOpenIcon
            aria-hidden="true"
            className="hidden text-ring group-data-panel-open:block"
          />
        </>
      ) : (
        <span aria-hidden="true" className="flex text-ring">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </CollapsibleTrigger>
  );
}

function ExampleFile({
  children,
  current,
  onClick,
}: {
  children: ReactNode;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={current ? "page" : undefined}
      onClick={onClick}
      className="flex w-full items-center gap-1.5 rounded-md py-1 ps-6 pe-2 text-left text-sm outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:bg-secondary aria-[current=page]:text-secondary-foreground"
    >
      <FileCode2Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
      <span className="truncate">{children}</span>
    </button>
  );
}
