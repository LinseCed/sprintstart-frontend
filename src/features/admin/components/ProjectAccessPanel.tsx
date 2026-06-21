import { useEffect, useState } from "react";
import { ExternalLink, Folder, Plus, Search, Trash2 } from "lucide-react";
import type { ProjectSummary } from "../types";

export type ProjectAccessPanelProps = {
    assignedProjects: ProjectSummary[];
    availableProjects: ProjectSummary[];
    onOpenProjectDetails: (projectId: string) => void;
};

export function ProjectAccessPanel({
    assignedProjects,
    availableProjects,
    onOpenProjectDetails,
}: ProjectAccessPanelProps) {
    const [draftProjectIds, setDraftProjectIds] = useState<Set<string>>(
        new Set(assignedProjects.map((project) => project.id)),
    );
    const [projectSearch, setProjectSearch] = useState("");
    const [openProjectPicker, setOpenProjectPicker] = useState(false);

    useEffect(() => {
        setDraftProjectIds(new Set(assignedProjects.map((project) => project.id)));
        setProjectSearch("");
        setOpenProjectPicker(false);
    }, [assignedProjects]);

    const assignedDraftProjects = availableProjects.filter((project) =>
        draftProjectIds.has(project.id),
    );

    const projectOptions = availableProjects.filter((project) => {
        const isAlreadyAssigned = draftProjectIds.has(project.id);
        const matchesSearch =
            projectSearch.trim().length === 0 ||
            project.name.toLowerCase().includes(projectSearch.trim().toLowerCase()) ||
            project.id.toLowerCase().includes(projectSearch.trim().toLowerCase());

        return !isAlreadyAssigned && matchesSearch;
    });

    const addProject = (projectId: string) => {
        setDraftProjectIds((current) => {
            const next = new Set(current);
            next.add(projectId);
            return next;
        });

        setProjectSearch("");
        setOpenProjectPicker(false);
    };

    const removeProject = (projectId: string) => {
        setDraftProjectIds((current) => {
            const next = new Set(current);
            next.delete(projectId);
            return next;
        });
    };

    return (
        <div className="rounded-3xl border border-app-border bg-app-surface-muted p-4">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="items-center align-middle">
                    <p className="text-2xl font-semibold text-app-text">Projects</p>
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setOpenProjectPicker((current) => !current)}
                        className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add project
                    </button>

                    {openProjectPicker && (
                        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-app-border bg-app-surface p-2 shadow-xl">
                            <div className="relative mb-2">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-text-disabled" />
                                <input
                                    value={projectSearch}
                                    onChange={(event) => setProjectSearch(event.target.value)}
                                    placeholder="Search projects..."
                                    className="h-9 w-full rounded-xl border border-app-border bg-app-surface-muted pl-9 pr-3 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
                                />
                            </div>

                            <div className="max-h-64 space-y-1 overflow-auto">
                                {projectOptions.length > 0 ? (
                                    projectOptions.map((project) => (
                                        <button
                                            key={project.id}
                                            type="button"
                                            onClick={() => addProject(project.id)}
                                            className="w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-app-surface-hover"
                                        >
                                            <p className="text-sm font-medium text-app-text">
                                                {project.name}
                                            </p>
                                            <p className="mt-0.5 truncate font-mono text-xs text-app-text-muted">
                                                {project.id}
                                            </p>
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-3 py-3 text-sm text-app-text-muted">
                                        No unassigned projects available.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                {assignedDraftProjects.length > 0 ? (
                    assignedDraftProjects.map((project) => (
                        <div
                            key={project.id}
                            className="rounded-2xl border border-app-border bg-app-surface px-4 py-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-surface-muted text-app-text-muted">
                                        <Folder className="h-4 w-4" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-app-text">
                                            {project.name}
                                        </p>
                                        <p className="mt-1 break-all font-mono text-xs text-app-text-muted">
                                            {project.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onOpenProjectDetails(project.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-disabled transition-colors hover:bg-app-brand-soft hover:text-app-brand-text"
                                        aria-label={`Open ${project.name} project details`}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeProject(project.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-disabled transition-colors hover:bg-app-danger-bg hover:text-app-danger-text"
                                        aria-label={`Remove ${project.name}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-app-border bg-app-surface px-4 py-8 text-center lg:col-span-2">
                        <p className="text-sm font-medium text-app-text">No projects assigned</p>
                        <p className="mt-1 text-sm text-app-text-muted">
                            Add a project to assign this user to a project.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
