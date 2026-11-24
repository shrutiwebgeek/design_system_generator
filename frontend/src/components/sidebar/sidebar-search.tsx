import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import * as styles from "@/styles/sidebar.styles";

interface SidebarSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
}

/** Escape or × clears it. */
export function SidebarSearch({ query, onQueryChange }: SidebarSearchProps) {
  return (
    <div className="relative">
      <SearchIcon aria-hidden="true" className={styles.searchIcon} />
      <Input
        type="search"
        aria-label="Search components"
        placeholder="Search components"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onQueryChange("");
        }}
        className={styles.searchInput}
      />
      {query !== "" && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onQueryChange("")}
          className={styles.clearButton}
        >
          <XIcon aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </div>
  );
}
