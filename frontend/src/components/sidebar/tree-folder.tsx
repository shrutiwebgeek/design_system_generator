import { ChevronRightIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import * as styles from "@/styles/sidebar.styles";

interface TreeFolderProps {
  label: ReactNode;
  kind?: styles.FolderKind;
  icon?: ReactNode;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
}

export function TreeFolder({
  label,
  kind = "folder",
  icon,
  open,
  onOpenChange,
  children,
}: TreeFolderProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={styles.folderRows[kind]}>
        <ChevronRightIcon aria-hidden="true" className={styles.chevron} />
        {icon ? (
          <span aria-hidden="true" className={styles.kindIcon}>
            {icon}
          </span>
        ) : (
          <>
            <FolderIcon aria-hidden="true" className={styles.folderIcon} />
            <FolderOpenIcon
              aria-hidden="true"
              className={styles.folderOpenIcon}
            />
          </>
        )}
        <span className="truncate">{label}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** One level deeper in the tree; its children are list items. */
export function Branch({ children }: { children: ReactNode }) {
  return <ul className={styles.branch}>{children}</ul>;
}
