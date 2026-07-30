import { useContext } from "react";
import { ProjectContext, type ProjectContextValue } from "./ProjectContext";

/**
 * Reads the globally selected project.
 *
 * Throws when used outside `ProjectProvider`, so a component can never silently
 * fall back to its own copy of the selection — that divergence is exactly what
 * the provider replaced.
 */
export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }

  return context;
}
