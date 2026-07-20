import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import type { SelectableProject } from "../ProjectContext";

type ProjectSwitcherPopoverProps = {
  projects: SelectableProject[];
  selectedProjectId: string;
  isLoading: boolean;
  errorMessage: string | null;
  listboxId: string;
  onSelect: (projectId: string) => void;
  onClose: () => void;
};

type ProjectGroup = {
  label: string;
  projects: SelectableProject[];
};

function matchesSearch(project: SelectableProject, search: string): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return (
    project.name.toLowerCase().includes(term) ||
    project.description.toLowerCase().includes(term)
  );
}

/**
 * Searchable project list rendered above the switcher trigger.
 *
 * Implemented as a combobox: focus stays in the search field and the active
 * option is communicated through `aria-activedescendant`, so typing and
 * arrowing work without moving DOM focus between list items.
 */
export function ProjectSwitcherPopover({
  projects,
  selectedProjectId,
  isLoading,
  errorMessage,
  listboxId,
  onSelect,
  onClose,
}: ProjectSwitcherPopoverProps) {
  const [search, setSearch] = useState("");
  // Tracked as an id rather than an index so narrowing the filter can never
  // leave the active option pointing at the wrong row (or out of range).
  const [activeProjectId, setActiveProjectId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleProjects = useMemo(
    () => projects.filter((project) => matchesSearch(project, search)),
    [projects, search],
  );

  const groups = useMemo<ProjectGroup[]>(() => {
    const managed = visibleProjects.filter((project) => project.isManaged);
    const member = visibleProjects.filter((project) => !project.isManaged);

    return [
      { label: "Managed by you", projects: managed },
      { label: "Member of", projects: member },
    ].filter((group) => group.projects.length > 0);
  }, [visibleProjects]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const optionId = (projectId: string) => `${listboxId}-option-${projectId}`;

  // Falls back to the first visible row whenever the tracked option is filtered
  // out, so there is always exactly one active option without an extra render.
  const activeIndex = Math.max(
    visibleProjects.findIndex((project) => project.id === activeProjectId),
    0,
  );
  const activeProject = visibleProjects[activeIndex] ?? null;

  const moveActive = (nextIndex: number) => {
    const project = visibleProjects[nextIndex];
    if (project) setActiveProjectId(project.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (!visibleProjects.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActive((activeIndex + 1) % visibleProjects.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActive(
        (activeIndex - 1 + visibleProjects.length) % visibleProjects.length,
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      moveActive(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      moveActive(visibleProjects.length - 1);
      return;
    }

    if (event.key === "Enter" && activeProject) {
      event.preventDefault();
      onSelect(activeProject.id);
    }
  };

  return (
    <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-2xl border border-app-border bg-app-surface p-2 shadow-xl">
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={listboxId}
          aria-activedescendant={
            activeProject ? optionId(activeProject.id) : undefined
          }
          aria-label="Search projects"
          autoComplete="off"
          placeholder="Search projects..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleKeyDown}
          className="h-10 w-full rounded-xl border border-app-border bg-app-bg pl-9 pr-3 text-sm text-app-text placeholder:text-app-text-muted focus:border-app-brand-border-strong focus:outline-none focus:ring-2 focus:ring-app-brand-glow"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 px-3 py-4 text-sm text-app-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading projects...
        </div>
      ) : errorMessage ? (
        <p className="px-3 py-4 text-sm text-app-danger-text">{errorMessage}</p>
      ) : !projects.length ? (
        <p className="px-3 py-4 text-sm text-app-text-muted">
          No projects available yet.
        </p>
      ) : !visibleProjects.length ? (
        <p className="px-3 py-4 text-sm text-app-text-muted">
          No projects match &ldquo;{search.trim()}&rdquo;.
        </p>
      ) : (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Projects"
          className="max-h-[280px] space-y-1 overflow-y-auto"
        >
          {groups.map((group) => (
            <li key={group.label} role="presentation">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-app-text-muted">
                {group.label}
              </p>

              <ul role="presentation" className="space-y-1">
                {group.projects.map((project) => {
                  const isSelected = project.id === selectedProjectId;
                  const isActive = project.id === activeProject?.id;

                  return (
                    <li key={project.id} role="presentation">
                      <button
                        type="button"
                        id={optionId(project.id)}
                        role="option"
                        aria-selected={isSelected}
                        // Focus stays in the search field; the listbox is driven
                        // through aria-activedescendant instead.
                        tabIndex={-1}
                        onClick={() => onSelect(project.id)}
                        onMouseEnter={() => setActiveProjectId(project.id)}
                        className={[
                          "flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "border-app-brand bg-app-brand-soft text-app-text"
                            : isActive
                              ? "border-app-border-strong bg-app-surface-hover text-app-text"
                              : "border-transparent text-app-text-muted",
                        ].join(" ")}
                      >
                        <span className="truncate">{project.name}</span>

                        {isSelected ? (
                          <Check className="ml-auto h-4 w-4 shrink-0 text-app-brand" />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
