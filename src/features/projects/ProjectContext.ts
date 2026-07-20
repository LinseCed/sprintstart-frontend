import { createContext } from "react";
import type { AdminProject } from "../../services/projectService";

/**
 * A project the current user can switch to, plus whether they manage it.
 *
 * `isManaged` drives both the grouping in the switcher and whether management
 * affordances are offered. It mirrors the backend's project manager assignment,
 * not the global PM role — holding the PM role does not imply managing a
 * specific project.
 */
export type SelectableProject = AdminProject & {
  isManaged: boolean;
};

export type ProjectContextValue = {
  /** All projects the user may switch between, managed ones first. */
  projects: SelectableProject[];
  selectedProject: SelectableProject | null;
  selectedProjectId: string;
  /** Whether the user manages the currently selected project. */
  canManageSelected: boolean;
  /** Whether the project switcher should be offered at all for this role. */
  isSwitcherEnabled: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  setSelectedProjectId: (projectId: string) => void;
  reloadProjects: () => Promise<void>;
};

export const ProjectContext = createContext<ProjectContextValue | undefined>(
  undefined,
);
