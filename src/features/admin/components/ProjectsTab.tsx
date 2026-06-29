import { ChevronRight, FileText, Folder, Users } from "lucide-react";
import { getProjectSourcesCount, getProjectUsersCount } from "../data";
import type { ProjectOverview } from "../types";
import { AccessBadge } from "./Badges";

type ProjectsTabProps = {
    filteredProjects: ProjectOverview[];
    onOpenProjectDetails: (project: ProjectOverview) => void;
};

export function ProjectsTab({ filteredProjects, onOpenProjectDetails }: ProjectsTabProps) {
    if (filteredProjects.length === 0) {
        return (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-app-border bg-app-surface px-6 text-center">
                <p className="text-base font-medium text-app-text">No projects found</p>
                <p className="mt-1 text-sm text-app-text-muted">
                    Try another search term or create a new project first.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {filteredProjects.map((project) => {
                const visibleSources = project.sources.slice(0, 3);

                return (
                    <button
                        key={project.id}
                        type="button"
                        onClick={() => onOpenProjectDetails(project)}
                        className="group flex w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-2xl border border-app-border bg-app-surface p-5 text-left transition-colors hover:border-app-border-strong hover:bg-app-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-app-brand-glow sm:flex-row sm:items-start sm:justify-between"
                        aria-label={`Open details for ${project.name}`}
                    >
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-app-border bg-app-surface-muted text-app-text-muted">
                                <Folder className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-app-text">
                                        {project.name}
                                    </span>
                                </div>

                                <p className="line-clamp-2 text-sm leading-relaxed text-app-text-muted">
                                    {project.description || "No project description available yet."}
                                </p>

                                {visibleSources.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {visibleSources.map((source) => (
                                            <AccessBadge key={source.id} variant="neutral">
                                                {source.type}
                                            </AccessBadge>
                                        ))}

                                        {project.sources.length > visibleSources.length && (
                                            <AccessBadge variant="neutral">
                                                +{project.sources.length - visibleSources.length}
                                            </AccessBadge>
                                        )}
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-app-text-disabled">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5" />
                                        {getProjectUsersCount(project)} members
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        {getProjectSourcesCount(project)} sources
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl text-app-text-muted transition-colors group-hover:text-app-text sm:self-center">
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
