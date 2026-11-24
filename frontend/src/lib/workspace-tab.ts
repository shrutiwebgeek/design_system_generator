const WORKSPACE_TABS = ["preview", "code", "tests"] as const;

export type WorkspaceTab = (typeof WORKSPACE_TABS)[number];

export const isWorkspaceTab = (value: unknown): value is WorkspaceTab =>
  WORKSPACE_TABS.some((tab) => tab === value);
