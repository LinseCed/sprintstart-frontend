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
    createDataSource,
    INGESTION_RUN_LIMIT,
    SOURCE_META,
    SOURCE_SYSTEMS,
} from "../features/data-ingestion/data.ts";
import type {
    ActiveTab,
    ConnectState,
    DataSource,
    IngestionRun,
    LoadingState,
    SourceIngestionStatus,
    SourceSystem,
} from "../features/data-ingestion/types.ts";
import {
    getIngestionRuns,
    getIngestionStatus,
} from "../services/ingestionService.ts";
import { connectGithubRepository } from "../services/sources/githubService.ts";

async function fetchIngestionData() {
    const [statusData, runData] = await Promise.all([
        getIngestionStatus(),
        getIngestionRuns(INGESTION_RUN_LIMIT),
    ]);

    return { statusData, runData };
}

export function DataIngestionPage() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("sources");
    const [selectedSourceSystem, setSelectedSourceSystem] =
        useState<SourceSystem | null>(null);

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

    const [connectState, setConnectState] = useState<ConnectState>("idle");
    const [connectErrorMessage, setConnectErrorMessage] = useState<string | null>(
        null,
    );
    const [connectSuccessMessage, setConnectSuccessMessage] = useState<
        string | null
    >(null);

    const loadData = useCallback(async () => {
        setLoadingState("loading");
        setErrorMessage(null);

        try {
            const { statusData, runData } = await fetchIngestionData();

            setSourceStatuses(statusData);
            setRuns(runData);
            setLoadingState("success");
        } catch (error) {
            setLoadingState("error");
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to load ingestion data",
            );
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        void fetchIngestionData()
            .then(({ statusData, runData }) => {
                if (!isMounted) return;

                setSourceStatuses(statusData);
                setRuns(runData);
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
    }, []);

    const handleOpenSourceModal = () => {
        setConnectState("idle");
        setConnectErrorMessage(null);
        setSelectedConnectSourceSystem("GITHUB");
        setIsSourceModalOpen(true);
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
                if (selectedConnectSourceSystem !== "GITHUB") {
                    throw new Error(
                        `${SOURCE_META[selectedConnectSourceSystem].type} connection is not available yet.`,
                    );
                }

                const trimmedOwner = githubOwner.trim();
                const trimmedRepositoryName = githubRepositoryName.trim();

                if (!trimmedOwner || !trimmedRepositoryName) {
                    throw new Error(
                        "Please enter both repository owner and repository name.",
                    );
                }

                await connectGithubRepository({
                    owner: trimmedOwner,
                    name: trimmedRepositoryName,
                });

                setConnectState("success");
                setConnectSuccessMessage(
                    `GitHub repository "${trimmedOwner}/${trimmedRepositoryName}" connected. Initial ingestion is running in the background.`,
                );

                setGithubOwner("");
                setGithubRepositoryName("");
                setIsSourceModalOpen(false);
                setActiveTab("sources");

                await loadData();

                window.setTimeout(() => {
                    void loadData();
                }, 1500);
            } catch (error) {
                setConnectState("error");
                setConnectErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to connect source",
                );
            }
        },
        [
            githubOwner,
            githubRepositoryName,
            loadData,
            selectedConnectSourceSystem,
        ],
    );

    const sources = useMemo<DataSource[]>(() => {
        const statusBySource = new Map<SourceSystem, SourceIngestionStatus>();

        sourceStatuses.forEach((status) => {
            statusBySource.set(status.sourceSystem, status);
        });

        return SOURCE_SYSTEMS.map((sourceSystem) =>
            createDataSource(sourceSystem, statusBySource.get(sourceSystem)),
        );
    }, [sourceStatuses]);

    const selectedSource = useMemo(() => {
        if (!selectedSourceSystem) return null;

        return (
            sources.find((source) => source.sourceSystem === selectedSourceSystem) ??
            null
        );
    }, [selectedSourceSystem, sources]);

    const isDetailsOpen = selectedSource !== null;
    const isLoading = loadingState === "loading";
    const shouldShowInitialLoading =
        isLoading && sources.every((source) => source.lastRunAt === null);

    return (
        <div className="min-h-screen bg-app-bg">
            <div
                className={`transition-[padding] duration-300 ease-out ${
                    isDetailsOpen ? "xl:pr-[440px]" : ""
                }`}
            >
                <DataIngestionHeader
                    isLoading={isLoading}
                    onRefresh={() => {
                        void loadData();
                    }}
                />

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
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
                                        selectedSourceSystem={selectedSourceSystem}
                                        onSelectSource={setSelectedSourceSystem}
                                    />
                                ) : null}

                                {!isLoading && activeTab === "artifacts" ? (
                                    <ArtifactTable />
                                ) : null}

                                {!isLoading && activeTab === "runs" ? (
                                    <RunHistory runs={runs} />
                                ) : null}
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            {selectedSource && (
                <SourceDetailsPanel
                    source={selectedSource}
                    onClose={() => setSelectedSourceSystem(null)}
                />
            )}

            {isSourceModalOpen && (
                <SourceConnectModal
                    selectedSourceSystem={selectedConnectSourceSystem}
                    sourceSystems={SOURCE_SYSTEMS}
                    sourceMeta={SOURCE_META}
                    owner={githubOwner}
                    repositoryName={githubRepositoryName}
                    connectState={connectState}
                    errorMessage={connectErrorMessage}
                    onSourceSystemChange={(sourceSystem) => {
                        setSelectedConnectSourceSystem(sourceSystem);
                        setConnectState("idle");
                        setConnectErrorMessage(null);
                    }}
                    onOwnerChange={setGithubOwner}
                    onRepositoryNameChange={setGithubRepositoryName}
                    onClose={handleCloseSourceModal}
                    onSubmit={(event) => {
                        void handleConnectSource(event);
                    }}
                />
            )}
        </div>
    );
}
