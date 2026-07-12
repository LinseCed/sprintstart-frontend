import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { ArtifactTable } from "../features/data-ingestion/components/ArtifactTable.tsx";
import { DataIngestionHeader } from "../features/data-ingestion/components/DataIngestionHeader.tsx";
import { DataIngestionLoadingState } from "../features/data-ingestion/components/DataIngestionLoadingState.tsx";
import { DataIngestionTabs } from "../features/data-ingestion/components/DataIngestionTabs.tsx";
import { IngestionMetrics } from "../features/data-ingestion/components/IngestionMetrics.tsx";
import { RunHistory } from "../features/data-ingestion/components/RunHistory.tsx";
import { SourceConnectModal } from "../features/data-ingestion/components/SourceConnectModal.tsx";
import { SourceDetailsPanel } from "../features/data-ingestion/components/SourceDetailsPanel.tsx";
import { SourceList } from "../features/data-ingestion/components/SourceList.tsx";
import {
  formatDateTime,
  getBackendSourceStatusLabel,
  getSourceStatus,
  getSourceStatusFromBackend,
  INGESTION_RUN_LIMIT,
  isRunInProgress,
  SOURCE_META,
  SOURCE_SYSTEMS,
} from "../features/data-ingestion/data.ts";
import type {
  ActiveTab,
  BackendProjectSourceStatus,
  ConnectState,
  DataSource,
  GithubRepositoryReference,
  IngestionRun,
  LoadingState,
  SourceIngestionStatus,
  SourceSystem,
} from "../features/data-ingestion/types.ts";
import {
  getIngestionRuns,
  getIngestionStatus,
} from "../services/ingestionService.ts";
import { useAuth } from "../context/useAuth";
import { useProjectSelection } from "../features/projects/useProjectSelection.ts";
import {
  connectGithubRepository,
  getGithubPatNames,
  updateAllGithubRepositories,
  updateGithubRepository,
} from "../services/sources/githubService.ts";
import type { ProjectSource } from "../services/projectService.ts";

const GITHUB_REPOSITORY_STORAGE_KEY =
  "sprintstart:data-ingestion:last-github-repository";

async function fetchIngestionData() {
  const [statusData, runData] = await Promise.all([
    getIngestionStatus(),
    getIngestionRuns(INGESTION_RUN_LIMIT),
  ]);

  return { statusData, runData };
}

function parseGithubRepositoryInput(
  ownerInput: string,
  repositoryInput: string,
) {
  const trimmedOwnerInput = ownerInput.trim();
  const trimmedRepositoryInput = repositoryInput.trim();
  const parsedOwnerInput = parseGithubRepositoryReference(trimmedOwnerInput);

  if (parsedOwnerInput) {
    return parsedOwnerInput;
  }

  if (trimmedOwnerInput && trimmedRepositoryInput) {
    return {
      owner: trimmedOwnerInput,
      name: trimmedRepositoryInput,
    };
  }

  return null;
}

function parseGithubRepositoryReference(value: string) {
  const normalizedInput = value
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");

  const [owner, name] = normalizedInput
    .split("/")
    .filter((segment) => segment.length > 0);

  if (owner && name) {
    return { owner, name };
  }

  return null;
}

function readStoredGithubRepository(): GithubRepositoryReference | null {
  try {
    const value = window.localStorage.getItem(GITHUB_REPOSITORY_STORAGE_KEY);

    if (!value) return null;

    const repository = JSON.parse(value) as Partial<GithubRepositoryReference>;

    if (repository.owner && repository.name) {
      return {
        owner: repository.owner,
        name: repository.name,
      };
    }
  } catch {
    window.localStorage.removeItem(GITHUB_REPOSITORY_STORAGE_KEY);
  }

  return null;
}

function storeGithubRepository(repository: GithubRepositoryReference) {
  window.localStorage.setItem(
    GITHUB_REPOSITORY_STORAGE_KEY,
    JSON.stringify(repository),
  );
}

function toSourceSystem(value: string): SourceSystem | null {
  const normalized = value.toUpperCase();

  if (
    normalized === "GITHUB" ||
    normalized === "JIRA" ||
    normalized === "UPLOAD"
  ) {
    return normalized;
  }

  return null;
}

function buildProjectDataSources(
  projectSources: ProjectSource[],
  sourceStatuses: SourceIngestionStatus[],
  runs: IngestionRun[],
): DataSource[] {
  const statusBySource = new Map<SourceSystem, SourceIngestionStatus>();
  const latestRunBySource = new Map<SourceSystem, IngestionRun>();

  sourceStatuses.forEach((status) => {
    statusBySource.set(status.sourceSystem, status);
  });

  runs.forEach((run) => {
    if (!latestRunBySource.has(run.sourceSystem)) {
      latestRunBySource.set(run.sourceSystem, run);
    }
  });

  return projectSources.flatMap((projectSource) => {
    const sourceSystem = toSourceSystem(projectSource.type);
    if (!sourceSystem) return [];

    const meta = SOURCE_META[sourceSystem];
    const status = statusBySource.get(sourceSystem);
    const latestRun = latestRunBySource.get(sourceSystem);
    const backendStatus = projectSource.status as BackendProjectSourceStatus;
    const latestIngestedCount =
      latestRun?.ingestedCount ?? status?.ingestedCount ?? 0;
    const latestUpdatedCount =
      latestRun?.updatedCount ?? status?.updatedCount ?? 0;
    const failedItems = latestRun?.failedItems ?? status?.failedItems ?? [];
    const errors =
      latestRun?.failedCount ?? status?.failedCount ?? failedItems.length;
    const lastRunAt = latestRun?.startedAt ?? status?.lastRunTime ?? null;
    const hasNeverSynced = lastRunAt === null;
    const runStatus = latestRun?.status ?? status?.status ?? null;
    const runtimeStatus = getSourceStatus(
      hasNeverSynced,
      errors > 0,
      runStatus,
    );
    const backendDerivedStatus = getSourceStatusFromBackend(backendStatus);
    const sourceStatus =
      runtimeStatus === "warning" && !hasNeverSynced
        ? runtimeStatus
        : backendDerivedStatus;

    return [
      {
        sourceId: projectSource.id,
        sourceSystem,
        name: projectSource.name,
        type: meta.type,
        icon: meta.icon,
        status: sourceStatus,
        backendStatus,
        statusLabel: hasNeverSynced
          ? getBackendSourceStatusLabel(backendStatus)
          : sourceStatus === "running"
            ? "Running"
            : getBackendSourceStatusLabel(backendStatus),
        artifacts: latestIngestedCount,
        lastSync: formatDateTime(lastRunAt),
        nextSync: "Not available",
        errors,
        description: meta.description,
        lastRunAt,
        latestIngestedCount,
        latestUpdatedCount,
        failedItems,
      },
    ];
  });
}

function hasSourceId(sources: DataSource[], sourceId: string) {
  return sources.some((source) => source.sourceId === sourceId);
}

export function DataIngestionPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("sources");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const [sourceStatuses, setSourceStatuses] = useState<SourceIngestionStatus[]>(
    [],
  );
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [selectedConnectSourceSystem, setSelectedConnectSourceSystem] =
    useState<SourceSystem>("GITHUB");

  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepositoryName, setGithubRepositoryName] = useState("");
  const [githubTokenName, setGithubTokenName] = useState("");
  const [githubTokenNames, setGithubTokenNames] = useState<string[]>([]);
  const [lastGithubRepository, setLastGithubRepository] =
    useState<GithubRepositoryReference | null>(() =>
      readStoredGithubRepository(),
    );

  const [connectState, setConnectState] = useState<ConnectState>("idle");
  const [connectErrorMessage, setConnectErrorMessage] = useState<string | null>(
    null,
  );
  const [connectSuccessMessage, setConnectSuccessMessage] = useState<
    string | null
  >(null);
  const [pollingUntil, setPollingUntil] = useState<number | null>(null);

  const {
    projects,
    selectedProject,
    selectedProjectId,
    isLoading: isLoadingProjects,
    errorMessage: projectErrorMessage,
    setSelectedProjectId,
    reloadProjects,
  } = useProjectSelection();

  const commitIngestionData = useCallback(
    (statusData: SourceIngestionStatus[], runData: IngestionRun[]) => {
      setSourceStatuses(statusData);
      setRuns(runData);
    },
    [],
  );

  const loadData = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoadingState("loading");
      }
      setErrorMessage(null);

      try {
        const { statusData, runData } = await fetchIngestionData();

        commitIngestionData(statusData, runData);
        setLoadingState("success");
      } catch (error) {
        if (showLoading) {
          setLoadingState("error");
        }
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load ingestion data",
        );
      }
    },
    [commitIngestionData],
  );

  useEffect(() => {
    let isMounted = true;

    void fetchIngestionData()
      .then(({ statusData, runData }) => {
        if (!isMounted) return;

        commitIngestionData(statusData, runData);
        setLoadingState("success");
      })
      .catch((error: unknown) => {
        if (!isMounted) return;

        setLoadingState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load ingestion data",
        );
      });

    return () => {
      isMounted = false;
    };
  }, [commitIngestionData]);

  useEffect(() => {
    const hasRunningRun = runs.some((run) => isRunInProgress(run.status));
    const isPollingWindowActive =
      pollingUntil !== null && Date.now() < pollingUntil;

    if (!hasRunningRun && !isPollingWindowActive) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const shouldStopPolling =
        pollingUntil !== null &&
        Date.now() >= pollingUntil &&
        !runs.some((run) => isRunInProgress(run.status));

      if (shouldStopPolling) {
        setPollingUntil(null);
        return;
      }

      void loadData(false);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [loadData, pollingUntil, runs]);

  const sources = useMemo<DataSource[]>(() => {
    return buildProjectDataSources(
      selectedProject?.sources ?? [],
      sourceStatuses,
      runs,
    );
  }, [runs, selectedProject?.sources, sourceStatuses]);

  useEffect(() => {
    setSelectedSourceId((currentSourceId) =>
      currentSourceId && hasSourceId(sources, currentSourceId)
        ? currentSourceId
        : null,
    );
  }, [sources]);

  const visibleSourceSystems = useMemo(
    () => new Set(sources.map((source) => source.sourceSystem)),
    [sources],
  );

  const visibleRuns = useMemo(
    () => runs.filter((run) => visibleSourceSystems.has(run.sourceSystem)),
    [runs, visibleSourceSystems],
  );

  const selectedSource = useMemo(() => {
    if (!selectedSourceId) return null;

    return (
      sources.find((source) => source.sourceId === selectedSourceId) ?? null
    );
  }, [selectedSourceId, sources]);

  const handleOpenSourceModal = () => {
    setConnectState("idle");
    setConnectErrorMessage(null);
    setSelectedConnectSourceSystem("GITHUB");
    setIsSourceModalOpen(true);

    void getGithubPatNames()
      .then((tokenNames) => {
        setGithubTokenNames(tokenNames);
        setGithubTokenName((currentTokenName) =>
          currentTokenName.trim() ? currentTokenName : (tokenNames[0] ?? ""),
        );
      })
      .catch(() => {
        setGithubTokenNames([]);
      });
  };

  const handleCloseSourceModal = () => {
    if (connectState === "loading") return;

    setIsSourceModalOpen(false);
    setConnectState("idle");
    setConnectErrorMessage(null);
  };

  const handleConnectSource = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setConnectState("loading");
      setConnectErrorMessage(null);
      setConnectSuccessMessage(null);

      try {
        if (!selectedProjectId) {
          throw new Error(
            "Please select a project before connecting a source.",
          );
        }

        if (selectedConnectSourceSystem !== "GITHUB") {
          throw new Error(
            `${SOURCE_META[selectedConnectSourceSystem].type} connection is not available yet.`,
          );
        }

        const parsedRepository = parseGithubRepositoryInput(
          githubOwner,
          githubRepositoryName,
        );

        if (!parsedRepository) {
          throw new Error(
            "Please enter a GitHub repository as owner/name, a GitHub URL, or owner and repository name.",
          );
        }

        const trimmedTokenName = githubTokenName.trim();

        if (!trimmedTokenName) {
          throw new Error("Please choose a saved GitHub access token.");
        }

        await connectGithubRepository({
          ...parsedRepository,
          tokenName: trimmedTokenName,
          projectId: selectedProjectId,
        });
        storeGithubRepository(parsedRepository);
        setLastGithubRepository(parsedRepository);

        setConnectState("success");
        setConnectSuccessMessage(
          `GitHub repository "${parsedRepository.owner}/${parsedRepository.name}" connected to ${selectedProject?.name ?? "the selected project"}. Initial ingestion is running in the background.`,
        );
        setPollingUntil(Date.now() + 60000);

        setGithubOwner("");
        setGithubRepositoryName("");
        setIsSourceModalOpen(false);
        setActiveTab("sources");

        await Promise.all([loadData(), reloadProjects()]);

        window.setTimeout(() => {
          void loadData(false);
          void reloadProjects();
        }, 1500);
      } catch (error) {
        setConnectState("error");
        setConnectErrorMessage(
          error instanceof Error ? error.message : "Failed to connect source",
        );
      }
    },
    [
      githubOwner,
      githubRepositoryName,
      githubTokenName,
      loadData,
      reloadProjects,
      selectedConnectSourceSystem,
      selectedProject?.name,
      selectedProjectId,
    ],
  );

  const handleUpdateSource = useCallback(
    async (sourceSystem: SourceSystem) => {
      if (sourceSystem !== "GITHUB") {
        throw new Error(
          `${SOURCE_META[sourceSystem].type} updates are not available yet.`,
        );
      }

      const repositoryLabel = lastGithubRepository
        ? `${lastGithubRepository.owner}/${lastGithubRepository.name}`
        : "all connected GitHub repositories";

      if (lastGithubRepository) {
        await updateGithubRepository(lastGithubRepository);
      } else {
        await updateAllGithubRepositories();
      }

      setPollingUntil(Date.now() + 60000);
      setConnectSuccessMessage(`Update for ${repositoryLabel} started.`);

      await loadData(false);

      window.setTimeout(() => {
        void loadData(false);
      }, 1500);
    },
    [lastGithubRepository, loadData],
  );

  const isLoading = loadingState === "loading" || isLoadingProjects;
  const shouldShowInitialLoading =
    isLoading && sources.every((source) => source.lastRunAt === null);

  return (
    <div className="min-h-screen bg-app-bg">
      <div>
        <DataIngestionHeader
          isLoading={isLoading}
          projects={projects}
          selectedProjectId={selectedProjectId}
          isLoadingProjects={isLoadingProjects}
          projectErrorMessage={projectErrorMessage}
          onProjectChange={setSelectedProjectId}
          onRefresh={() => {
            void loadData();
            void reloadProjects();
          }}
          showProjectSelect={profile?.permissionGroup === "ADMIN"}
        />

        <main className="app-page-shell">
          <div className="space-y-8">
            {errorMessage && (
              <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-5 py-4 text-sm text-app-warning-text">
                {errorMessage}
              </div>
            )}

            {connectSuccessMessage && (
              <div className="flex flex-col gap-3 rounded-2xl border border-app-success-border bg-app-success-bg px-5 py-4 text-sm text-app-success-text sm:flex-row sm:items-center sm:justify-between">
                <p>{connectSuccessMessage}</p>

                <button
                  type="button"
                  onClick={() => setConnectSuccessMessage(null)}
                  className="self-start rounded-lg px-2 py-1 text-xs font-semibold transition hover:bg-app-surface sm:self-auto"
                >
                  Dismiss
                </button>
              </div>
            )}

            <IngestionMetrics sources={sources} />

            <section className="overflow-hidden rounded-3xl border border-app-border bg-app-surface">
              <DataIngestionTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddSource={handleOpenSourceModal}
              />

              <div className="space-y-4 p-5 sm:p-6">
                {shouldShowInitialLoading ? (
                  <DataIngestionLoadingState />
                ) : null}

                {!isLoading && activeTab === "sources" ? (
                  <SourceList
                    sources={sources}
                    selectedSourceId={selectedSourceId}
                    onSelectSource={setSelectedSourceId}
                  />
                ) : null}

                {!isLoading && activeTab === "artifacts" ? (
                  <ArtifactTable sources={sources} runs={visibleRuns} />
                ) : null}

                {!isLoading && activeTab === "runs" ? (
                  <RunHistory runs={visibleRuns} />
                ) : null}
              </div>
            </section>
          </div>
        </main>
      </div>

      {selectedSource && (
        <SourceDetailsPanel
          source={selectedSource}
          githubRepository={
            selectedSource.sourceSystem === "GITHUB"
              ? lastGithubRepository
              : null
          }
          onUpdateSource={handleUpdateSource}
          onClose={() => setSelectedSourceId(null)}
        />
      )}

      {isSourceModalOpen && (
        <SourceConnectModal
          selectedSourceSystem={selectedConnectSourceSystem}
          sourceSystems={SOURCE_SYSTEMS}
          sourceMeta={SOURCE_META}
          owner={githubOwner}
          repositoryName={githubRepositoryName}
          tokenName={githubTokenName}
          tokenNames={githubTokenNames}
          connectState={connectState}
          errorMessage={connectErrorMessage}
          onSourceSystemChange={(sourceSystem) => {
            setSelectedConnectSourceSystem(sourceSystem);
            setConnectState("idle");
            setConnectErrorMessage(null);
          }}
          onOwnerChange={setGithubOwner}
          onRepositoryNameChange={setGithubRepositoryName}
          onTokenNameChange={setGithubTokenName}
          onClose={handleCloseSourceModal}
          onSubmit={(event) => {
            void handleConnectSource(event);
          }}
        />
      )}
    </div>
  );
}
