import { useEffect, useState } from "react";
import { AlertCircle, Folder, Loader2 } from "lucide-react";
import { projectService } from "../../../services/projectService";
import { DetailsSideDrawer } from "../../../components/layout/DetailsSideDrawer";
import {
    getProjectSourcesCount,
    getProjectUsersCount,
} from "../data";
import type { AdminProjectDetails, LoadingState, ProjectOverview } from "../types";
import { AccessBadge } from "./Badges";
import { ProjectUserList } from "./ProjectUserList";
import { Section } from "./Section";
import { SourceList } from "./SourceList";

type ProjectDetailsDrawerProps = {
    project: ProjectOverview;
    isOpen: boolean;
    onClose: () => void;
};

export function ProjectDetailsDrawer({
    project,
    isOpen,
    onClose,
}: ProjectDetailsDrawerProps) {
    const [projectDetails, setProjectDetails] = useState<AdminProjectDetails | null>(null);
    const [detailsLoadingState, setDetailsLoadingState] = useState<LoadingState>("idle");
    const [detailsErrorMessage, setDetailsErrorMessage] = useState("");

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;

        async function loadProjectDetails() {
            setDetailsLoadingState("loading");
            setDetailsErrorMessage("");

            try {
                const nextProjectDetails = await projectService.getProjectById(project.id);

                if (!isMounted) return;

                setProjectDetails(nextProjectDetails);
                setDetailsLoadingState("success");
            } catch (error) {
                if (!isMounted) return;

                setProjectDetails(null);
                setDetailsLoadingState("error");
                setDetailsErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Project details could not be loaded.",
                );
            }
        }

        void loadProjectDetails();

        return () => {
            isMounted = false;
        };
    }, [isOpen, project.id]);

    useEffect(() => {
        setProjectDetails(null);
        setDetailsLoadingState("idle");
        setDetailsErrorMessage("");
    }, [project.id]);

    const visibleProject = projectDetails ?? project;
    const memberCount = getProjectUsersCount(visibleProject);
    const sourceCount = getProjectSourcesCount(visibleProject);
    const isLoadingDetails = detailsLoadingState === "loading" && !projectDetails;
    const hasDetailsError = detailsLoadingState === "error";

    return (
        <DetailsSideDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={visibleProject.name}
            closeAriaLabel="Close project details"
            widthClassName="w-[min(94vw,34rem)] lg:w-[min(72vw,58rem)]"
            leading={
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-app-border bg-app-surface-muted text-app-text-muted">
                    <Folder className="h-6 w-6" />
                </div>
            }
            badge={
                <>
                    <AccessBadge variant="neutral">
                        {memberCount > 0 ? `${memberCount} members` : "No members"}
                    </AccessBadge>
                    <AccessBadge variant={sourceCount > 0 ? "success" : "neutral"}>
                        {sourceCount > 0 ? `${sourceCount} sources` : "No sources"}
                    </AccessBadge>
                </>
            }
        >
            {isLoadingDetails ? (
                <div className="flex min-h-72 items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-app-text-muted">
                        <Loader2 className="h-7 w-7 animate-spin text-app-brand" />
                        <p className="text-sm">Loading project details...</p>
                    </div>
                </div>
            ) : hasDetailsError ? (
                <div className="rounded-2xl border border-app-danger-border bg-app-danger-bg p-5">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-app-danger-text">
                        <AlertCircle className="h-4 w-4" />
                        Project details could not be loaded
                    </div>
                    <p className="text-sm text-app-danger-text">{detailsErrorMessage}</p>
                </div>
            ) : (
                <>
                    <Section>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                            Description
                        </p>
                        <p className="text-sm leading-relaxed text-app-text-muted">
                            {visibleProject.description || "No project description available yet."}
                        </p>
                    </Section>

                    <Section>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                            Connected sources
                        </p>
                        <SourceList sources={visibleProject.sources} />
                    </Section>

                    <Section>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                            Assigned users
                        </p>
                        <ProjectUserList users={visibleProject.users} />
                    </Section>
                </>
            )}
        </DetailsSideDrawer>
    );
}
