import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarClock, Plug } from "lucide-react";
import { Modal } from "../components/ui/Modal.tsx";
import { DataIngestionHeader } from "../features/data-ingestion/components/DataIngestionHeader.tsx";
import { DataIngestionLoadingState } from "../features/data-ingestion/components/DataIngestionLoadingState.tsx";
import { DataIngestionSectionFilter } from "../features/data-ingestion/components/DataIngestionSectionFilter.tsx";
import { OverviewSection } from "../features/data-ingestion/components/OverviewSection.tsx";
import { RunDetailsPanel } from "../features/data-ingestion/components/RunDetailsPanel.tsx";
import { RunHistory } from "../features/data-ingestion/components/RunHistory.tsx";
import { GithubRepositorySyncSettings } from "../features/data-ingestion/components/GithubRepositorySyncSettings.tsx";
import { AddSourceModal } from "../features/data-ingestion/components/AddSourceModal.tsx";
import { SourceConnectModal } from "../features/data-ingestion/components/SourceConnectModal.tsx";
import { SourceDetailsPanel } from "../features/data-ingestion/components/SourceDetailsPanel.tsx";
import { SourceList } from "../features/data-ingestion/components/SourceList.tsx";
import { ConnectorList } from "../features/connectors/components/ConnectorList.tsx";
import { ConnectorsLoadingState } from "../features/connectors/components/ConnectorsLoadingState.tsx";
import { toConnectorListItems } from "../features/connectors/data.ts";
import type { ConnectorListItem } from "../features/connectors/types.ts";
import {
  connectorService,
  type ConnectorSource,
} from "../services/connectorService.ts";
import {
  deriveSourceStatus,
  formatDateTime,
  getBackendSourceStatusLabel,
  getSourceStatus,
  getSourceStatusFromBackend,
  getSourceStatusLabel,
  INGESTION_RUN_LIMIT,
  isRunInProgress,
  SOURCE_META,
  SOURCE_SYSTEMS,
} from "../features/data-ingestion/data.ts";
import type {
  Artifact,
  ConnectState,
  DataSource,
  GithubRepositoryDetails,
  GithubRepositoryReference,
  IngestionRun,
  LoadingState,
  SectionKey,
  SourceIngestionStatus,
  SourceSystem,
} from "../features/data-ingestion/types.ts";
import {
  getIngestionRuns,
  getIngestionStatus,
  getProjectArtifactSnapshot,
} from "../services/ingestionService.ts";
import { useAuth } from "../context/useAuth";
import { useProjectContext } from "../features/projects/useProjectContext.ts";
import {
  configureAllGithubRepositories,
  configureGithubRepository,
  connectGithubRepository,
  getGithubRepositoryConfig,
  getGithubPatNames,
  updateGithubRepository,
  type ConfigureGithubRepositoryRequest,
} from "../services/sources/githubService.ts";
import {
  projectService,
  type ProjectSource,
} from "../services/projectService.ts";
import {
  parseGithubRepositoryInput,
  parseGithubRepositoryReference,
} from "../services/sources/githubRepositoryInput.ts";

const GITHUB_REPOSITORY_STORAGE_KEY =
  "sprintstart:data-ingestion:last-github-repository";
const DEFAULT_GLOBAL_GITHUB_SYNC_CONFIG: ConfigureGithubRepositoryRequest = {
  autoUpdate: true,
  schedule: { type: "INTERVAL", everyMinutes: 60 },
};

async function fetchIngestionData() {
  const [statusData, runData] = await Promise.all([
    getIngestionStatus(),
    getIngestionRuns(INGESTION_RUN_LIMIT),
  ]);

  return { statusData, runData };
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

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function getArtifactSearchText(artifact: Artifact) {
  return [
    artifact.title,
    artifact.sourceUrl,
    artifact.metadata,
    artifact.sourceSystem,
    artifact.artifactType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getProjectSourceArtifacts(
  artifacts: Artifact[],
  projectSource: ProjectSource,
  sourceSystem: SourceSystem,
  sourceCountForSystem: number,
) {
  const sourceArtifacts = artifacts.filter(
    (artifact) => artifact.sourceSystem === sourceSystem,
  );

  if (sourceCountForSystem <= 1) {
    return sourceArtifacts;
  }

  const candidates = [projectSource.name, projectSource.id]
    .map(normalizeSearchValue)
    .filter((value) => value.length > 0);

  return sourceArtifacts.filter((artifact) => {
    const artifactSearchText = getArtifactSearchText(artifact);
    return candidates.some((candidate) =>
      artifactSearchText.includes(candidate),
    );
  });
}

function getLatestArtifactIngestedAt(artifacts: Artifact[]) {
  return artifacts.reduce<string | null>((latest, artifact) => {
    if (!latest) return artifact.ingestedAt;

    return new Date(artifact.ingestedAt).getTime() > new Date(latest).getTime()
      ? artifact.ingestedAt
      : latest;
  }, null);
}

type GithubArtifactMetadataPayload = {
  repositoryId?: string;
  repositoryFullName?: string;
};

function parseGithubArtifactMetadata(
  artifact: Artifact,
): GithubArtifactMetadataPayload | null {
  try {
    const metadata = JSON.parse(
      artifact.metadata,
    ) as GithubArtifactMetadataPayload;

    if (metadata.repositoryId || metadata.repositoryFullName) {
      return metadata;
    }
  } catch {
    return null;
  }

  return null;
}

function getGithubMetadataForSource(
  artifacts: Artifact[],
  projectSource: ProjectSource,
) {
  const parsedMetadata = artifacts
    .map(parseGithubArtifactMetadata)
    .filter((metadata): metadata is GithubArtifactMetadataPayload =>
      Boolean(metadata),
    );

  return (
    parsedMetadata.find(
      (metadata) => metadata.repositoryId === projectSource.id,
    ) ??
    parsedMetadata[0] ??
    null
  );
}

function getConnectorSourceForGithubRepository(
  projectSource: ProjectSource,
  connectorSources: ConnectorSource[],
  repositoryFullName?: string,
) {
  const normalizedProjectSourceName = normalizeSearchValue(projectSource.name);
  const normalizedFullName = repositoryFullName
    ? normalizeSearchValue(repositoryFullName)
    : null;

  if (normalizedFullName) {
    const exactMatch = connectorSources.find((source) => {
      const normalizedSourceId = normalizeSearchValue(source.id);
      const normalizedSourceUrl = normalizeSearchValue(source.url);

      return (
        normalizedSourceId === normalizedFullName ||
        normalizedSourceUrl.includes(`github.com/${normalizedFullName}`)
      );
    });

    if (exactMatch) return exactMatch;
  }

  return connectorSources.find(
    (source) =>
      normalizeSearchValue(source.name) === normalizedProjectSourceName,
  );
}

function getGithubRepositoryDetails(
  projectSource: ProjectSource,
  artifacts: Artifact[],
  connectorSources: ConnectorSource[],
): GithubRepositoryDetails | null {
  const metadata = getGithubMetadataForSource(artifacts, projectSource);
  const metadataReference = metadata?.repositoryFullName
    ? parseGithubRepositoryReference(metadata.repositoryFullName)
    : null;
  const connectorSource = getConnectorSourceForGithubRepository(
    projectSource,
    connectorSources,
    metadata?.repositoryFullName,
  );
  const connectorReference = connectorSource
    ? (parseGithubRepositoryReference(connectorSource.id) ??
      parseGithubRepositoryReference(connectorSource.url))
    : null;
  const artifactReference =
    artifacts
      .map((artifact) =>
        parseGithubRepositoryReference(artifact.sourceUrl ?? ""),
      )
      .find((reference): reference is GithubRepositoryReference =>
        Boolean(reference),
      ) ?? null;
  const sourceIdReference = parseGithubRepositoryReference(projectSource.id);
  const repositoryReference =
    metadataReference ??
    connectorReference ??
    artifactReference ??
    sourceIdReference;

  if (!repositoryReference) return null;

  const fullName = `${repositoryReference.owner}/${repositoryReference.name}`;
  const hasRepositorySourceId = sourceIdReference !== null;

  return {
    ...repositoryReference,
    repositoryId:
      metadata?.repositoryId ??
      (hasRepositorySourceId ? null : projectSource.id),
    fullName,
    url: connectorSource?.url ?? `https://github.com/${fullName}`,
    enabled: connectorSource?.enabled ?? null,
  };
}

function getIngestionStatusLabel(
  hasNeverSynced: boolean,
  hasErrors: boolean,
  runStatus: IngestionRun["status"] | null,
) {
  if (!hasNeverSynced && !hasErrors && runStatus === null) {
    return "Synced";
  }

  return getSourceStatusLabel(hasNeverSynced, hasErrors, runStatus);
}

function buildProjectDataSources(
  projectSources: ProjectSource[],
  sourceStatuses: SourceIngestionStatus[],
  runs: IngestionRun[],
  artifacts: Artifact[],
  githubConnectorSources: ConnectorSource[],
): DataSource[] {
  const statusBySource = new Map<SourceSystem, SourceIngestionStatus>();
  const latestRunBySource = new Map<SourceSystem, IngestionRun>();
  const sourceCountBySystem = new Map<SourceSystem, number>();

  projectSources.forEach((projectSource) => {
    const sourceSystem = toSourceSystem(projectSource.type);
    if (!sourceSystem) return;

    sourceCountBySystem.set(
      sourceSystem,
      (sourceCountBySystem.get(sourceSystem) ?? 0) + 1,
    );
  });

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
    const backendStatus = projectSource.status;
    const matchedArtifacts = getProjectSourceArtifacts(
      artifacts,
      projectSource,
      sourceSystem,
      sourceCountBySystem.get(sourceSystem) ?? 1,
    );
    const githubRepository =
      sourceSystem === "GITHUB"
        ? getGithubRepositoryDetails(
            projectSource,
            matchedArtifacts,
            githubConnectorSources,
          )
        : null;
    const totalArtifactCount = matchedArtifacts.length;
    const runIds = Array.from(
      new Set(
        matchedArtifacts.flatMap((artifact) =>
          artifact.ingestionRunId ? [artifact.ingestionRunId] : [],
        ),
      ),
    );
    const sharesSourceSystem = (sourceCountBySystem.get(sourceSystem) ?? 1) > 1;
    const latestArtifactIngestedAt =
      getLatestArtifactIngestedAt(matchedArtifacts);
    const latestIngestedCount = totalArtifactCount;
    const latestUpdatedCount =
      latestRun?.updatedCount ?? status?.updatedCount ?? 0;
    const failedItems = latestRun?.failedItems ?? status?.failedItems ?? [];
    const errors =
      latestRun?.failedCount ?? status?.failedCount ?? failedItems.length;
    const lastRunAt =
      latestArtifactIngestedAt ??
      latestRun?.startedAt ??
      status?.lastRunTime ??
      null;
    const hasNeverSynced = lastRunAt === null;
    const runStatus = latestRun?.status ?? status?.status ?? null;
    const runtimeStatus = getSourceStatus(
      hasNeverSynced,
      errors > 0,
      runStatus,
    );
    const backendDerivedStatus = getSourceStatusFromBackend(backendStatus);

    return [
      {
        sourceId: projectSource.id,
        sourceSystem,
        name: projectSource.name,
        type: meta.type,
        icon: meta.icon,
        status: backendDerivedStatus,
        backendStatus,
        statusLabel: getBackendSourceStatusLabel(backendStatus),
        ingestionStatus: runtimeStatus,
        ingestionStatusLabel: getIngestionStatusLabel(
          hasNeverSynced,
          errors > 0,
          runStatus,
        ),
        statusView: deriveSourceStatus({
          backendStatus,
          runStatus,
          aiSyncStatus: latestRun?.aiSyncStatus ?? null,
          hasErrors: errors > 0,
          hasNeverSynced,
        }),
        artifacts: totalArtifactCount,
        lastSync: formatDateTime(lastRunAt),
        nextSync: "Not available",
        errors,
        description: meta.description,
        lastRunAt,
        latestIngestedCount,
        latestUpdatedCount,
        totalArtifactCount,
        runIds,
        sharesSourceSystem,
        failedItems,
        githubRepository,
      },
    ];
  });
}
function hasSourceId(sources: DataSource[], sourceId: string) {
  return sources.some((source) => source.sourceId === sourceId);
}

const STATUS_BADGE_TONE = {
  success:
    "border-app-success-border bg-app-success-bg text-app-success-text",
  brand: "border-app-brand-border bg-app-brand-soft text-app-brand-text",
  warning:
    "border-app-warning-border bg-app-warning-bg text-app-warning-text",
  neutral: "border-app-border bg-app-neutral-bg text-app-neutral-text",
} as const;

/** Small count badge summarising how many sources are in a given status. */
function StatusBadge({
  tone,
  children,
}: {
  tone: keyof typeof STATUS_BADGE_TONE;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${STATUS_BADGE_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function DataIngestionPage() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionKey>("all");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [sourceStatuses, setSourceStatuses] = useState<SourceIngestionStatus[]>(
    [],
  );
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [projectSources, setProjectSources] = useState<ProjectSource[]>([]);
  const [projectArtifacts, setProjectArtifacts] = useState<Artifact[]>([]);
  const [projectArtifactTotal, setProjectArtifactTotal] = useState(0);
  const [projectDataVersion, setProjectDataVersion] = useState(0);
  const [artifactSummaryErrorMessage, setArtifactSummaryErrorMessage] =
    useState<string | null>(null);
  const [projectSourcesErrorMessage, setProjectSourcesErrorMessage] =
    useState<string | null>(null);
  const [isProjectDataLoading, setIsProjectDataLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isConnectorsModalOpen, setIsConnectorsModalOpen] = useState(false);
  const [isSyncSettingsModalOpen, setIsSyncSettingsModalOpen] =
    useState(false);
  const [globalGithubSyncConfig, setGlobalGithubSyncConfig] =
    useState<ConfigureGithubRepositoryRequest>(
      DEFAULT_GLOBAL_GITHUB_SYNC_CONFIG,
    );
  const [selectedConnectSourceSystem, setSelectedConnectSourceSystem] =
    useState<SourceSystem>("GITHUB");

  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepositoryName, setGithubRepositoryName] = useState("");
  const [githubTokenName, setGithubTokenName] = useState("");
  const [githubTokenNames, setGithubTokenNames] = useState<string[]>([]);
  const [githubConnectorSources, setGithubConnectorSources] = useState<
    ConnectorSource[]
  >([]);

  const [connectState, setConnectState] = useState<ConnectState>("idle");
  const [connectErrorMessage, setConnectErrorMessage] = useState<string | null>(
    null,
  );
  const [connectSuccessMessage, setConnectSuccessMessage] = useState<
    string | null
  >(null);
  const [pollingUntil, setPollingUntil] = useState<number | null>(null);
  const [connectors, setConnectors] = useState<ConnectorListItem[]>([]);
  const [connectorsLoadingState, setConnectorsLoadingState] =
    useState<LoadingState>("idle");
  const [connectorsErrorMessage, setConnectorsErrorMessage] = useState<
    string | null
  >(null);
  const [hasLoadedConnectors, setHasLoadedConnectors] = useState(false);
  const [togglingConnectorId, setTogglingConnectorId] = useState<string | null>(
    null,
  );
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(
    null,
  );

  // The project is chosen globally in the sidebar switcher. The `?projectId=`
  // search param is still honoured so deep links from the admin view land on
  // the right project — it writes into the global selection below.
  const {
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    reloadProjects,
  } = useProjectContext();

  const requestedProjectId = searchParams.get("projectId") ?? "";
  const requestedSourceId = searchParams.get("sourceId") ?? "";

  // Tracks the last project we loaded data for, so an in-place refresh (a
  // `projectDataVersion` bump after saving) can reload without wiping the source
  // list — clearing it would drop `selectedSource` and close an open details
  // drawer mid-save. Only a real project switch resets the lists.
  const loadedProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!requestedProjectId || requestedProjectId === selectedProjectId) {
      return;
    }

    void Promise.resolve().then(() => {
      setSelectedProjectId(requestedProjectId);
    });
  }, [requestedProjectId, selectedProjectId, setSelectedProjectId]);

  // A project's connected sources come from the project-scoped detail endpoint
  // any member may reach, not from the admin-only project listing behind the
  // switcher (which leaves `sources` empty for PM/member users). Sources and
  // the artifact snapshot are fetched together so a project switch reveals the
  // repo and its ingested files as one unit: the state is reset up front (no
  // stale counts from the previous project) and a single loading flag covers
  // both, so the list never renders "done but empty" while the heavier snapshot
  // is still in flight.
  useEffect(() => {
    let isMounted = true;

    // Deferred to a microtask so the resets below do not run synchronously in
    // the effect body and cascade a render (same pattern as the provider).
    void Promise.resolve().then(async () => {
      if (!isMounted) return;

      // Only a real project switch clears the current lists; an in-place refresh
      // (same project, version bump) reloads without emptying them, so an open
      // details drawer and its selection survive a save.
      const isProjectSwitch = loadedProjectIdRef.current !== selectedProjectId;
      loadedProjectIdRef.current = selectedProjectId;

      if (isProjectSwitch) {
        setProjectSources([]);
        setProjectArtifacts([]);
        setProjectArtifactTotal(0);
      }
      setProjectSourcesErrorMessage(null);
      setArtifactSummaryErrorMessage(null);

      if (!selectedProjectId) {
        setIsProjectDataLoading(false);
        return;
      }

      if (isProjectSwitch) {
        setIsProjectDataLoading(true);
      }

      const [projectResult, snapshotResult] = await Promise.allSettled([
        projectService.getAccessibleProject(selectedProjectId),
        getProjectArtifactSnapshot(selectedProjectId),
      ]);

      if (!isMounted) return;

      if (projectResult.status === "fulfilled") {
        setProjectSources(projectResult.value.sources);
      } else {
        setProjectSourcesErrorMessage(
          projectResult.reason instanceof Error
            ? projectResult.reason.message
            : "Project sources could not be loaded.",
        );
      }

      if (snapshotResult.status === "fulfilled") {
        setProjectArtifacts(snapshotResult.value.artifacts);
        setProjectArtifactTotal(snapshotResult.value.totalElements);
      } else {
        setArtifactSummaryErrorMessage(
          snapshotResult.reason instanceof Error
            ? snapshotResult.reason.message
            : "Artifact summary could not be loaded.",
        );
      }

      setIsProjectDataLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [projectDataVersion, selectedProjectId]);

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

  const loadGithubConnectorSources = useCallback(async () => {
    try {
      // Scope to the selected project so a PM only sees their project's repos,
      // not every project's connected sources (the backend `projectId` filter).
      const response = await connectorService.getConnectorSources(
        "github",
        selectedProjectId || undefined,
      );
      setGithubConnectorSources(response.sources);
    } catch {
      setGithubConnectorSources([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    void Promise.resolve().then(() => loadGithubConnectorSources());
  }, [loadGithubConnectorSources]);

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
      projectSources,
      sourceStatuses,
      runs,
      projectArtifacts,
      githubConnectorSources,
    );
  }, [
    githubConnectorSources,
    projectArtifacts,
    projectSources,
    runs,
    sourceStatuses,
  ]);

  useEffect(() => {
    let isMounted = true;

    void Promise.resolve().then(() => {
      if (!isMounted) return;

      const requestedSourceExists =
        requestedSourceId.length > 0 && hasSourceId(sources, requestedSourceId);

      if (requestedSourceExists) {
        setActiveSection("sources");
      }

      setSelectedSourceId((currentSourceId) => {
        if (requestedSourceExists) {
          return requestedSourceId;
        }

        // Keep the current selection while the list is transiently empty (an
        // in-flight refresh), so an open details drawer isn't dropped. Only
        // clear when the list is populated and the source is genuinely gone.
        if (!currentSourceId || sources.length === 0) {
          return currentSourceId;
        }

        return hasSourceId(sources, currentSourceId) ? currentSourceId : null;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [requestedSourceId, sources]);

  const visibleSourceSystems = useMemo(
    () => new Set(sources.map((source) => source.sourceSystem)),
    [sources],
  );
  const hasGithubSources = visibleSourceSystems.has("GITHUB");

  const sourceHealth = useMemo(() => {
    const count = (state: DataSource["statusView"]["state"]) =>
      sources.filter((source) => source.statusView.state === state).length;

    return {
      total: sources.length,
      connected: count("connected"),
      syncing: count("syncing"),
      attention: count("attention"),
      disabled: count("disabled"),
    };
  }, [sources]);
  const canManageGithubSyncSettings =
    profile?.permissionGroup === "ADMIN" || profile?.permissionGroup === "PM";

  // The `/github/connect` endpoint only checks the global PM/ADMIN role, so the
  // backend accepts an ingest into a project the PM is merely a member of and
  // then fails deep in the pipeline with a 500. Mirror the product rule up front
  // instead: only the assigned project manager (or an admin) may connect a
  // source to a project.
  const canIngestIntoSelectedProject =
    profile?.permissionGroup === "ADMIN" ||
    (selectedProject?.isManaged ?? false);

  const visibleRuns = useMemo(
    () => runs.filter((run) => visibleSourceSystems.has(run.sourceSystem)),
    [runs, visibleSourceSystems],
  );

  const loadConnectors = useCallback(async () => {
    setConnectorsLoadingState("loading");
    setConnectorsErrorMessage(null);

    try {
      const response = await connectorService.listConnectors();
      setConnectors(toConnectorListItems(response));
      setHasLoadedConnectors(true);
      setConnectorsLoadingState("success");
    } catch (error) {
      setConnectorsLoadingState("error");
      setConnectorsErrorMessage(
        error instanceof Error ? error.message : "Failed to load connectors",
      );
    }
  }, []);

  const handleSectionChange = useCallback((section: SectionKey) => {
    setActiveSection(section);
  }, []);

  const handleOpenConnectorsModal = useCallback(() => {
    setIsConnectorsModalOpen(true);

    if (!hasLoadedConnectors && connectorsLoadingState !== "loading") {
      void loadConnectors();
    }
  }, [connectorsLoadingState, hasLoadedConnectors, loadConnectors]);

  const handleToggleConnectorEnabled = useCallback(
    async (connector: ConnectorListItem) => {
      setTogglingConnectorId(connector.id);
      setConnectorsErrorMessage(null);

      try {
        const response = await connectorService.setConnectorEnabled(
          connector.id,
          !connector.enabled,
        );

        setConnectors((current) =>
          current.map((item) =>
            item.id === connector.id ? { ...item, ...response } : item,
          ),
        );
      } catch (error) {
        setConnectorsErrorMessage(
          error instanceof Error ? error.message : "Failed to update connector",
        );
      } finally {
        setTogglingConnectorId(null);
      }
    },
    [],
  );

  const handleToggleConnectorSources = useCallback(
    (connector: ConnectorListItem) => {
      setSelectedConnectorId((current) =>
        current === connector.id ? null : connector.id,
      );
    },
    [],
  );

  const selectedSource = useMemo(() => {
    if (!selectedSourceId) return null;

    return (
      sources.find((source) => source.sourceId === selectedSourceId) ?? null
    );
  }, [selectedSourceId, sources]);

  const loadGithubTokenNames = useCallback(() => {
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
  }, []);

  // Discovery is the primary connect flow; the single-repo modal stays reachable
  // from inside it as a fallback.
  const handleOpenAddSourceModal = () => {
    setConnectErrorMessage(null);
    setIsAddSourceModalOpen(true);
    loadGithubTokenNames();
  };

  const handleOpenSourceModal = () => {
    setConnectState("idle");
    setConnectErrorMessage(null);
    setSelectedConnectSourceSystem("GITHUB");
    setIsSourceModalOpen(true);
    loadGithubTokenNames();
  };

  const handleCloseSourceModal = () => {
    if (connectState === "loading") return;

    setIsSourceModalOpen(false);
    setConnectState("idle");
    setConnectErrorMessage(null);
  };

  // Runs after the discovery modal batch-connects repositories: surface a
  // success message, kick the polling window and refresh the same data the
  // single-repo connect path refreshes.
  const handleDiscoveryConnected = useCallback(() => {
    setConnectSuccessMessage(
      `Selected repositories are connecting to ${selectedProject?.name ?? "the project"}. Initial ingestion is running in the background.`,
    );
    setPollingUntil(Date.now() + 60000);
    setActiveSection("sources");

    void Promise.all([
      loadData(false),
      reloadProjects(),
      loadGithubConnectorSources(),
    ]).then(() => setProjectDataVersion((version) => version + 1));

    window.setTimeout(() => {
      void loadData(false);
      void reloadProjects();
      void loadGithubConnectorSources();
      setProjectDataVersion((version) => version + 1);
    }, 1500);
  }, [
    loadData,
    loadGithubConnectorSources,
    reloadProjects,
    selectedProject,
  ]);

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

        if (!canIngestIntoSelectedProject) {
          throw new Error(
            `You can only connect sources to projects you manage. You are a member of "${selectedProject?.name ?? "this project"}" but not its project manager`,
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

        setConnectState("success");
        setConnectSuccessMessage(
          `GitHub repository "${parsedRepository.owner}/${parsedRepository.name}" connected to ${selectedProject?.name ?? "the selected project"}. Initial ingestion is running in the background.`,
        );
        setPollingUntil(Date.now() + 60000);

        setGithubOwner("");
        setGithubRepositoryName("");
        setIsSourceModalOpen(false);
        setActiveSection("sources");

        await Promise.all([
          loadData(),
          reloadProjects(),
          loadGithubConnectorSources(),
        ]);
        setProjectDataVersion((version) => version + 1);

        window.setTimeout(() => {
          void loadData(false);
          void reloadProjects();
          void loadGithubConnectorSources();
          setProjectDataVersion((version) => version + 1);
        }, 1500);
      } catch (error) {
        setConnectState("error");
        setConnectErrorMessage(
          error instanceof Error ? error.message : "Failed to connect source",
        );
      }
    },
    [
      canIngestIntoSelectedProject,
      githubOwner,
      githubRepositoryName,
      githubTokenName,
      loadData,
      loadGithubConnectorSources,
      reloadProjects,
      selectedConnectSourceSystem,
      selectedProject,
      selectedProjectId,
    ],
  );

  const handleUpdateSource = useCallback(
    async (source: DataSource) => {
      if (source.sourceSystem !== "GITHUB" || !source.githubRepository) {
        throw new Error(
          "Repository details are not available for this source.",
        );
      }

      await updateGithubRepository(source.githubRepository);

      setPollingUntil(Date.now() + 60000);
      setConnectSuccessMessage(
        `Update for ${source.githubRepository.fullName} started.`,
      );

      await Promise.all([loadData(false), loadGithubConnectorSources()]);
      setProjectDataVersion((version) => version + 1);

      window.setTimeout(() => {
        void loadData(false);
        void loadGithubConnectorSources();
        setProjectDataVersion((version) => version + 1);
      }, 1500);
    },
    [loadData, loadGithubConnectorSources],
  );

  const handleSaveGlobalGithubConfig = useCallback(
    async (request: ConfigureGithubRepositoryRequest) => {
      await configureAllGithubRepositories(request);
      setGlobalGithubSyncConfig(request);
      await Promise.all([
        loadData(false),
        reloadProjects(),
        loadGithubConnectorSources(),
      ]);
    },
    [loadData, loadGithubConnectorSources, reloadProjects],
  );

  const handleLoadGithubRepositoryConfig = useCallback(
    async (repository: GithubRepositoryDetails) => {
      return getGithubRepositoryConfig(repository);
    },
    [],
  );

  const handleSaveGithubRepositoryConfig = useCallback(
    async (
      repository: GithubRepositoryDetails,
      request: ConfigureGithubRepositoryRequest,
    ) => {
      await configureGithubRepository(repository, request);
      await Promise.all([
        loadData(false),
        reloadProjects(),
        loadGithubConnectorSources(),
      ]);
    },
    [loadData, loadGithubConnectorSources, reloadProjects],
  );

  const refreshSourceDetails = useCallback(async () => {
    await Promise.all([
      loadData(false),
      reloadProjects(),
      loadGithubConnectorSources(),
    ]);
    setProjectDataVersion((version) => version + 1);
  }, [loadData, loadGithubConnectorSources, reloadProjects]);

  // Enables/disables a connected repository as an ingestion source (the
  // connector allow/deny toggle), then refreshes so the drawer reflects it.
  const handleSetSourceEnabled = useCallback(
    async (repository: GithubRepositoryDetails, enabled: boolean) => {
      await connectorService.patchConnectorSources("github", [
        { sourceId: repository.fullName, enabled },
      ]);
      await refreshSourceDetails();
    },
    [refreshSourceDetails],
  );

  const isLoading = loadingState === "loading";

  const showOverview = activeSection === "all" || activeSection === "overview";
  const showSources = activeSection === "all" || activeSection === "sources";
  const showRuns = activeSection === "all" || activeSection === "runs";

  const shouldShowInitialLoading =
    (isLoading || (isProjectDataLoading && showSources)) &&
    sources.length === 0;

  const selectedRun = useMemo(
    () => visibleRuns.find((run) => run.runId === selectedRunId) ?? null,
    [selectedRunId, visibleRuns],
  );

  const closeSourceDetails = () => {
    setSelectedSourceId(null);

    if (!searchParams.has("sourceId")) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("sourceId");
    setSearchParams(nextSearchParams, { replace: true });
  };

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-app-bg [scrollbar-gutter:stable] lg:h-screen">
      <div>
        <DataIngestionHeader
          isLoading={isLoading}
          onAddSource={handleOpenAddSourceModal}
          onRefresh={() => {
            void loadData();
            void reloadProjects();
            void loadGithubConnectorSources();
            if (isConnectorsModalOpen) {
              void loadConnectors();
            }
            setProjectDataVersion((version) => version + 1);
          }}
        />

        <main className="app-page-shell">
          <div className="space-y-8">
            {errorMessage && (
              <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-5 py-4 text-sm text-app-warning-text">
                {errorMessage}
              </div>
            )}

            {artifactSummaryErrorMessage && (
              <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-5 py-4 text-sm text-app-warning-text">
                {artifactSummaryErrorMessage}
              </div>
            )}

            {projectSourcesErrorMessage && (
              <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-5 py-4 text-sm text-app-warning-text">
                {projectSourcesErrorMessage}
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

            <DataIngestionSectionFilter
              active={activeSection}
              onChange={handleSectionChange}
              sourceCount={sourceHealth.total}
              runCount={visibleRuns.length}
            />

            {shouldShowInitialLoading ? (
              <DataIngestionLoadingState />
            ) : (
              <div className="space-y-8">
                {showOverview ? (
                  <OverviewSection
                    sources={sources}
                    totalArtifactCount={projectArtifactTotal}
                    runs={visibleRuns}
                    onNavigate={handleSectionChange}
                  />
                ) : null}

                {showSources ? (
                  <section aria-label="Sources">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="mr-1 text-base font-bold tracking-tight text-app-text">
                          Sources
                        </h2>
                        {sourceHealth.connected > 0 && (
                          <StatusBadge tone="success">
                            {sourceHealth.connected} connected
                          </StatusBadge>
                        )}
                        {sourceHealth.syncing > 0 && (
                          <StatusBadge tone="brand">
                            {sourceHealth.syncing} syncing
                          </StatusBadge>
                        )}
                        {sourceHealth.attention > 0 && (
                          <StatusBadge tone="warning">
                            {sourceHealth.attention} need
                            {sourceHealth.attention === 1 ? "s" : ""} attention
                          </StatusBadge>
                        )}
                        {sourceHealth.disabled > 0 && (
                          <StatusBadge tone="neutral">
                            {sourceHealth.disabled} disabled
                          </StatusBadge>
                        )}
                      </div>

                      {canManageGithubSyncSettings ? (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <button
                            type="button"
                            onClick={handleOpenConnectorsModal}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-brand-text transition hover:text-app-brand"
                          >
                            <Plug className="h-4 w-4" />
                            Manage connectors
                          </button>

                          {hasGithubSources ? (
                            <button
                              type="button"
                              onClick={() => setIsSyncSettingsModalOpen(true)}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-app-brand-text transition hover:text-app-brand"
                            >
                              <CalendarClock className="h-4 w-4" />
                              Manage sync settings
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {!isProjectDataLoading ? (
                      <SourceList
                        sources={sources}
                        selectedSourceId={selectedSourceId}
                        onSelectSource={setSelectedSourceId}
                        onAddSource={handleOpenAddSourceModal}
                      />
                    ) : null}
                  </section>
                ) : null}

                {showRuns ? (
                  <section aria-label="Runs">
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-base font-bold tracking-tight text-app-text">
                        Runs
                      </h2>
                      <span className="rounded-full border border-app-border bg-app-bg-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-app-text-subtle">
                        {visibleRuns.length} recent
                      </span>
                    </div>
                    <RunHistory
                      runs={visibleRuns}
                      selectedRunId={selectedRunId}
                      onSelectRun={(run) => setSelectedRunId(run.runId)}
                    />
                  </section>
                ) : null}

              </div>
            )}
          </div>
        </main>
      </div>

      {selectedSource && (
        <SourceDetailsPanel
          source={selectedSource}
          onUpdateSource={handleUpdateSource}
          onRefreshDetails={refreshSourceDetails}
          canManageSyncSettings={canManageGithubSyncSettings}
          onLoadRepositoryConfig={handleLoadGithubRepositoryConfig}
          onSaveRepositoryConfig={handleSaveGithubRepositoryConfig}
          onSetSourceEnabled={handleSetSourceEnabled}
          onClose={closeSourceDetails}
        />
      )}

      {selectedRun && (
        <RunDetailsPanel
          run={selectedRun}
          onClose={() => setSelectedRunId(null)}
        />
      )}

      <Modal
        isOpen={isConnectorsModalOpen}
        title="Connectors"
        description="Enable or disable a connector, and choose which sources are in scope for this project."
        size="lg"
        bodyClassName="px-5 py-5 sm:px-7 sm:py-6"
        onClose={() => setIsConnectorsModalOpen(false)}
      >
        {connectorsErrorMessage && (
          <div className="mb-4 rounded-2xl border border-app-warning-border bg-app-warning-bg px-4 py-3 text-sm text-app-warning-text">
            {connectorsErrorMessage}
          </div>
        )}

        {connectorsLoadingState === "loading" && !hasLoadedConnectors ? (
          <ConnectorsLoadingState />
        ) : (
          <ConnectorList
            connectors={connectors}
            togglingConnectorId={togglingConnectorId}
            expandedConnectorId={selectedConnectorId}
            projectId={selectedProjectId}
            onToggleEnabled={(connector) => {
              void handleToggleConnectorEnabled(connector);
            }}
            onToggleSources={handleToggleConnectorSources}
            onSourcesSaved={() => {
              void loadConnectors();
              void loadGithubConnectorSources();
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={isSyncSettingsModalOpen}
        title="GitHub Sync Settings"
        description="Apply one sync policy to all connected GitHub repositories."
        size="lg"
        bodyClassName="px-5 py-5 sm:px-7 sm:py-6"
        onClose={() => setIsSyncSettingsModalOpen(false)}
      >
        <GithubRepositorySyncSettings
          initialConfig={globalGithubSyncConfig}
          onSave={handleSaveGlobalGithubConfig}
          showNextSync={false}
          disclaimer="Applying global settings overwrites the sync settings of every connected GitHub repository."
          autoUpdateOnText="Due checks update all connected GitHub repositories."
          autoUpdateOffText="Due checks only mark connected GitHub repositories out of date."
          toggleAriaLabel="Toggle global GitHub auto update"
          saveLabel="Apply globally"
        />
      </Modal>

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

      {isAddSourceModalOpen && (
        <AddSourceModal
          projectId={selectedProjectId}
          projectName={selectedProject?.name}
          tokenNames={githubTokenNames}
          canIngest={Boolean(selectedProjectId) && canIngestIntoSelectedProject}
          ingestBlockedReason={
            !selectedProjectId
              ? "Select a project before connecting repositories."
              : !canIngestIntoSelectedProject
                ? `You can only connect sources to projects you manage. You are a member of "${selectedProject?.name ?? "this project"}" but not its project manager.`
                : undefined
          }
          onClose={() => setIsAddSourceModalOpen(false)}
          onConnected={handleDiscoveryConnected}
          onSwitchToSingleRepo={() => {
            setIsAddSourceModalOpen(false);
            handleOpenSourceModal();
          }}
        />
      )}
    </div>
  );
}
