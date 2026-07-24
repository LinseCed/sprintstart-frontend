import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/Modal.tsx";
import { ApiError } from "../../../services/apiClient.ts";
import {
  addRepositoryToProject,
  connectRepositories,
  discoverRepositories,
  type DiscoveredRepository,
  type DiscoveryOwnerType,
} from "../../../services/sources/githubService.ts";
import { getIngestionSourceStatuses } from "../../../services/ingestionService.ts";
import {
  parseGithubOwnerInput,
  parseGithubRepositoryInput,
} from "../../../services/sources/githubRepositoryInput.ts";
import { connectGithubRepository } from "../../../services/sources/githubService.ts";
import { UploadArtifactPanel } from "../../knowledge-base/components/UploadArtifactPanel.tsx";
import { SOURCE_META, SOURCE_SYSTEMS } from "../data.ts";
import type { SourceSystem } from "../types.ts";

type AddSourceModalProps = {
  projectId: string | null;
  projectName?: string;
  tokenNames: string[];
  /** Whether the current user may connect sources to the selected project. */
  canIngest: boolean;
  /** Human-readable reason shown when `canIngest` is false. */
  ingestBlockedReason?: string;
  onClose: () => void;
  /** Called after a successful batch connect so the page can refresh. */
  onConnected: () => void;
};

type WizardStep = "type" | "detail";

/**
 * What connecting a discovered repository to the current project would mean.
 *
 * `alreadyConnected` from discovery is global: it says the repo is a SprintStart
 * source *somewhere*, not that it belongs to this project. Such a repo can be
 * linked to the current project without fetching or ingesting it again, which is
 * why it stays selectable instead of being greyed out.
 */
type RepositoryLinkState =
  /** Not a source yet: connecting fetches and ingests it. */
  | "new"
  /** Ingested elsewhere: connecting only links it, reusing its artifacts. */
  | "linkable"
  /** Already a source of this project: nothing left to do. */
  | "in-project"
  /** Ingested elsewhere, but its repository id could not be resolved. */
  | "unresolved";

const OWNER_TYPES: { value: DiscoveryOwnerType; label: string }[] = [
  { value: "org", label: "Organization" },
  { value: "user", label: "User" },
];

const PAGE_SIZE = 20;

/**
 * Two-step "Add sources" wizard. Step one picks the source type (GitHub, Jira,
 * Upload); step two shows the type-specific flow — GitHub opens the org/user
 * repository discovery (searchable, paginated, multi-select, with a single-repo
 * fallback), while not-yet-available types show a "coming soon" panel. This
 * keeps the familiar source-type choice while making discovery the GitHub path.
 */
export function AddSourceModal({
  projectId,
  projectName,
  tokenNames,
  canIngest,
  ingestBlockedReason,
  onClose,
  onConnected,
}: AddSourceModalProps) {
  const hasTokens = tokenNames.length > 0;

  const [step, setStep] = useState<WizardStep>("type");
  const [selectedType, setSelectedType] = useState<SourceSystem>("GITHUB");
  // Within the GitHub step: browse an org/user, or add one known repository.
  const [githubMode, setGithubMode] = useState<"discover" | "single">(
    "discover",
  );
  const [singleOwner, setSingleOwner] = useState("");
  const [singleName, setSingleName] = useState("");
  // Locks Back/Cancel while an upload batch is in flight.
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [ownerInput, setOwnerInput] = useState("");
  const [ownerType, setOwnerType] = useState<DiscoveryOwnerType>("org");
  const [tokenName, setTokenName] = useState(tokenNames[0] ?? "");
  const [filter, setFilter] = useState("");

  // The parent loads the saved token names asynchronously *after* opening the
  // modal, so on the very first open `tokenNames` is empty and `tokenName`
  // initialises to "" — which made discovery reject with "choose a token" until
  // the modal was closed and reopened. Adopt the first token as soon as the list
  // arrives (and heal a selection that is no longer available), instead of only
  // reading the prop once at mount.
  useEffect(() => {
    if (tokenNames.length === 0) return;

    // Deferred to a microtask so the state update does not run synchronously in
    // the effect body and cascade a render (the pattern used across the app).
    void Promise.resolve().then(() => {
      setTokenName((current) =>
        current && tokenNames.includes(current) ? current : tokenNames[0],
      );
    });
  }, [tokenNames]);

  // The owner that actually produced the current results, used at connect time
  // (discovered repos carry only their name, not their owner).
  const [resolvedOwner, setResolvedOwner] = useState("");
  const [repositories, setRepositories] = useState<DiscoveredRepository[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  // "owner/name" (lowercased) -> repository id, for every repo connected anywhere,
  // plus the subset already belonging to the current project.
  const [repositoryIdsByFullName, setRepositoryIdsByFullName] = useState<
    Map<string, string>
  >(new Map());
  const [projectFullNames, setProjectFullNames] = useState<Set<string>>(
    new Set(),
  );

  const [discoverState, setDiscoverState] = useState<
    "idle" | "loading" | "loadingMore" | "loaded" | "error"
  >("idle");
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [connectState, setConnectState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [connectError, setConnectError] = useState<string | null>(null);

  const isBusy = discoverState === "loading" || connectState === "loading";
  const isGithub = selectedType === "GITHUB";

  // Discovery only reports *that* a repo is already a source, not its id or which
  // projects it belongs to. The per-repo status endpoint supplies both, so an
  // already-ingested repo can be linked to this project instead of being blocked.
  const loadConnectedRepositories = useCallback(async () => {
    if (!projectId) return;

    try {
      const [allConnected, connectedToProject] = await Promise.all([
        getIngestionSourceStatuses(),
        getIngestionSourceStatuses(projectId),
      ]);

      setRepositoryIdsByFullName(
        new Map(
          allConnected.map((status) => [
            status.sourceId.toLowerCase(),
            status.repositoryId,
          ]),
        ),
      );
      setProjectFullNames(
        new Set(
          connectedToProject.map((status) => status.sourceId.toLowerCase()),
        ),
      );
    } catch {
      // Degrades gracefully: without ids, already-connected repos stay
      // unselectable rather than offering an action that would fail.
      setRepositoryIdsByFullName(new Map());
      setProjectFullNames(new Set());
    }
  }, [projectId]);

  const runDiscovery = useCallback(
    async (nextPage: number) => {
      const owner = parseGithubOwnerInput(ownerInput);

      if (!owner) {
        setDiscoverState("error");
        setDiscoverError(
          "Enter a GitHub organization or user (e.g. SprintStartProject or github.com/username).",
        );
        return;
      }

      if (!tokenName.trim()) {
        setDiscoverState("error");
        setDiscoverError("Choose a stored GitHub access token.");
        return;
      }

      const loadingMore = nextPage > 0;
      setDiscoverState(loadingMore ? "loadingMore" : "loading");
      setDiscoverError(null);
      setConnectError(null);

      try {
        const result = await discoverRepositories(
          owner,
          tokenName.trim(),
          ownerType,
          nextPage,
          PAGE_SIZE,
        );

        setResolvedOwner(owner);
        setHasMore(result.hasMore);
        setPage(nextPage);
        setRepositories((current) =>
          loadingMore ? [...current, ...result.repositories] : result.repositories,
        );
        setDiscoverState("loaded");

        if (!loadingMore) {
          await loadConnectedRepositories();
        }
      } catch (error) {
        setDiscoverState("error");

        if (error instanceof ApiError && error.status === 404) {
          setDiscoverError(
            `No GitHub organization or user "${owner}" was found for the selected token.`,
          );
        } else if (error instanceof ApiError && error.status === 429) {
          setDiscoverError(
            "GitHub rate limit reached. Please wait a moment and try again.",
          );
        } else {
          setDiscoverError(
            error instanceof Error
              ? error.message
              : "Repositories could not be discovered.",
          );
        }
      }
    },
    [loadConnectedRepositories, ownerInput, ownerType, tokenName],
  );

  const filteredRepositories = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    if (!normalized) return repositories;

    return repositories.filter((repository) =>
      repository.name.toLowerCase().includes(normalized),
    );
  }, [filter, repositories]);

  const linkStateByName = useMemo(() => {
    const states = new Map<string, RepositoryLinkState>();

    repositories.forEach((repository) => {
      const fullName = `${resolvedOwner}/${repository.name}`.toLowerCase();

      if (projectFullNames.has(fullName)) {
        states.set(repository.name, "in-project");
      } else if (!repository.alreadyConnected) {
        states.set(repository.name, "new");
      } else if (repositoryIdsByFullName.has(fullName)) {
        states.set(repository.name, "linkable");
      } else {
        states.set(repository.name, "unresolved");
      }
    });

    return states;
  }, [
    projectFullNames,
    repositories,
    repositoryIdsByFullName,
    resolvedOwner,
  ]);

  const isSelectable = (name: string) => {
    const state = linkStateByName.get(name) ?? "new";
    return state === "new" || state === "linkable";
  };

  const selectableVisible = filteredRepositories.filter((repository) =>
    isSelectable(repository.name),
  );
  const allVisibleSelected =
    selectableVisible.length > 0 &&
    selectableVisible.every((repository) => selected.has(repository.name));

  const toggleRepository = (name: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        selectableVisible.forEach((repository) => next.delete(repository.name));
      } else {
        selectableVisible.forEach((repository) => next.add(repository.name));
      }
      return next;
    });
  };

  const selectedCount = selected.size;
  const selectedLinkCount = Array.from(selected).filter(
    (name) => linkStateByName.get(name) === "linkable",
  ).length;

  const handleConnect = async () => {
    if (!projectId) {
      setConnectState("error");
      setConnectError("Select a project before connecting repositories.");
      return;
    }

    if (!canIngest) {
      setConnectState("error");
      setConnectError(
        ingestBlockedReason ??
          "You can only connect sources to projects you manage.",
      );
      return;
    }

    const chosen = repositories.filter((repository) =>
      selected.has(repository.name),
    );

    if (chosen.length === 0) {
      setConnectState("error");
      setConnectError("Select at least one repository to connect.");
      return;
    }

    setConnectState("loading");
    setConnectError(null);

    // Repos already ingested elsewhere are linked to this project (reusing their
    // artifacts); only genuinely new ones go through fetch + ingestion.
    const toLink = chosen.filter(
      (repository) => linkStateByName.get(repository.name) === "linkable",
    );
    const toIngest = chosen.filter(
      (repository) => linkStateByName.get(repository.name) !== "linkable",
    );

    try {
      for (const repository of toLink) {
        const repositoryId = repositoryIdsByFullName.get(
          `${resolvedOwner}/${repository.name}`.toLowerCase(),
        );

        if (!repositoryId) continue;

        await addRepositoryToProject(repositoryId, projectId);
      }

      if (toIngest.length > 0) {
        await connectRepositories(
          toIngest.map((repository) => ({
            owner: resolvedOwner,
            name: repository.name,
          })),
          tokenName.trim(),
          projectId,
        );
      }

      setConnectState("idle");
      onConnected();
      onClose();
    } catch (error) {
      setConnectState("error");
      setConnectError(
        error instanceof Error
          ? error.message
          : "The selected repositories could not be connected.",
      );
    }
  };

  const isSingleRepo = isGithub && githubMode === "single";
  const isUpload = selectedType === "UPLOAD";

  /**
   * Connects one known repository. Kept inside this modal so the single-repo
   * path shares the wizard's chrome, project guardrails and token picker instead
   * of dropping the user into a separate, differently-shaped dialog.
   */
  const handleConnectSingle = async () => {
    if (!projectId) {
      setConnectState("error");
      setConnectError("Select a project before connecting a repository.");
      return;
    }

    if (!canIngest) {
      setConnectState("error");
      setConnectError(
        ingestBlockedReason ??
          "You can only connect sources to projects you manage.",
      );
      return;
    }

    const parsed = parseGithubRepositoryInput(singleOwner, singleName);

    if (!parsed) {
      setConnectState("error");
      setConnectError(
        "Enter the repository as owner/name, a GitHub URL, or fill in owner and repository name.",
      );
      return;
    }

    if (!tokenName.trim()) {
      setConnectState("error");
      setConnectError("Choose a stored GitHub access token.");
      return;
    }

    setConnectState("loading");
    setConnectError(null);

    try {
      await connectGithubRepository({
        ...parsed,
        tokenName: tokenName.trim(),
        projectId,
      });

      setConnectState("idle");
      onConnected();
      onClose();
    } catch (error) {
      setConnectState("error");
      setConnectError(
        error instanceof Error
          ? error.message
          : "The repository could not be connected.",
      );
    }
  };

  const modalTitle =
    step === "type"
      ? "Add a data source"
      : isSingleRepo
        ? "Add a single repository"
        : isGithub
          ? "Discover GitHub repositories"
          : isUpload
            ? "Upload Files"
            : `Connect ${SOURCE_META[selectedType].type}`;

  const modalDescription =
    step === "type"
      ? projectName
        ? `Choose which source type to connect to ${projectName}.`
        : "Choose which source type you want to connect."
      : isSingleRepo
        ? "Connect one repository you already know the name of."
        : isGithub
          ? "Find and connect repositories from a GitHub organization or user."
          : isUpload
            ? "Add documents to this project's knowledge base."
            : undefined;

  return (
    <Modal
      isOpen
      title={modalTitle}
      description={modalDescription}
      size="xl"
      isDismissDisabled={connectState === "loading" || isUploadingFiles}
      onClose={onClose}
      closeLabel="Close add source"
      bodyClassName="px-5 py-5 sm:px-7 sm:py-6"
      headerActions={
        step === "detail" && isGithub ? (
          <button
            type="button"
            onClick={() => {
              setConnectError(null);
              setGithubMode(isSingleRepo ? "discover" : "single");
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs font-semibold text-app-text transition hover:border-app-brand-border hover:bg-app-surface-hover"
          >
            {isSingleRepo ? (
              <>
                <Search className="h-3.5 w-3.5" />
                Discover repositories
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Add single repo
              </>
            )}
          </button>
        ) : undefined
      }
      footer={
        step === "type" ? (
          <>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-surface-hover"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setStep("detail")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-app-brand-hover"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep("type")}
              disabled={connectState === "loading" || isUploadingFiles}
              className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={connectState === "loading" || isUploadingFiles}
              className="rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            {isSingleRepo && (
              <button
                type="button"
                onClick={() => void handleConnectSingle()}
                disabled={connectState === "loading" || !canIngest}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connectState === "loading" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {connectState === "loading"
                  ? "Connecting…"
                  : "Connect repository"}
              </button>
            )}

            {isGithub && !isSingleRepo && (
              <button
                type="button"
                onClick={() => void handleConnect()}
                disabled={
                  selectedCount === 0 || connectState === "loading" || !canIngest
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-app-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connectState === "loading" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {connectState === "loading"
                  ? "Connecting…"
                  : `Connect ${selectedCount > 0 ? selectedCount : ""} selected`.replace(
                      /\s+/g,
                      " ",
                    )}
              </button>
            )}
          </>
        )
      }
    >
      {step === "type" ? (
        <SourceTypeStep
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />
      ) : isUpload ? (
        projectId ? (
          <UploadArtifactPanel
            projectId={projectId}
            onUploadSuccess={onConnected}
            onFinished={onClose}
            onUploadingChange={setIsUploadingFiles}
          />
        ) : (
          <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-4 py-3 text-sm text-app-warning-text">
            Select a project before uploading files.
          </div>
        )
      ) : isSingleRepo ? (
        <SingleRepositoryStep
          owner={singleOwner}
          repositoryName={singleName}
          tokenName={tokenName}
          tokenNames={tokenNames}
          isBusy={connectState === "loading"}
          canIngest={canIngest}
          ingestBlockedReason={ingestBlockedReason}
          errorMessage={connectError}
          onOwnerChange={setSingleOwner}
          onRepositoryNameChange={setSingleName}
          onTokenNameChange={setTokenName}
          onSubmit={() => void handleConnectSingle()}
        />
      ) : isGithub ? (
        <div className="space-y-5">
          {!canIngest && (
            <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-4 py-3 text-sm text-app-warning-text">
              {ingestBlockedReason ??
                "You can only connect sources to projects you manage."}
            </div>
          )}

          {!hasTokens && (
            <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-4 py-3 text-sm text-app-warning-text">
              Add a GitHub personal access token in Settings first, then come
              back to discover repositories.
            </div>
          )}

          <form
            className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              void runDiscovery(0);
            }}
          >
            <div>
              <label
                htmlFor="discovery-owner"
                className="text-sm font-medium text-app-text"
              >
                Organization or user
              </label>
              <input
                id="discovery-owner"
                value={ownerInput}
                onChange={(event) => setOwnerInput(event.target.value)}
                disabled={isBusy || !hasTokens}
                placeholder="SprintStartProject or github.com/username"
                className="mt-2 h-11 w-full rounded-xl border border-app-border bg-app-surface px-4 text-sm text-app-text outline-none transition placeholder:text-app-text-disabled focus:border-app-brand disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="discovery-owner-type"
                className="text-sm font-medium text-app-text"
              >
                Type
              </label>
              <select
                id="discovery-owner-type"
                value={ownerType}
                onChange={(event) =>
                  setOwnerType(event.target.value as DiscoveryOwnerType)
                }
                disabled={isBusy || !hasTokens}
                className="mt-2 h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-app-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {OWNER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="discovery-token"
                className="text-sm font-medium text-app-text"
              >
                Access token
              </label>
              <select
                id="discovery-token"
                value={tokenName}
                onChange={(event) => setTokenName(event.target.value)}
                disabled={isBusy || !hasTokens}
                className="mt-2 h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-app-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {hasTokens ? (
                  tokenNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                ) : (
                  <option value="">No saved tokens</option>
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={isBusy || !hasTokens}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-app-brand bg-app-brand px-4 text-sm font-semibold text-white transition hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {discoverState === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Discover
            </button>
          </form>

          {discoverError && (
            <div className="flex items-start gap-2 rounded-2xl border border-app-warning-border bg-app-warning-bg px-4 py-3 text-sm text-app-warning-text">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{discoverError}</span>
            </div>
          )}

          {connectError && (
            <div className="flex items-start gap-2 rounded-2xl border border-app-danger-border bg-app-danger-bg px-4 py-3 text-sm text-app-danger-text">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{connectError}</span>
            </div>
          )}

          {discoverState === "loading" && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-app-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Discovering repositories…
            </div>
          )}

          {discoverState === "loaded" && repositories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
              <GitBranch className="mx-auto h-8 w-8 text-app-text-muted" />
              <p className="mt-3 text-sm font-semibold text-app-text">
                No repositories found
              </p>
              <p className="mt-1 text-sm text-app-text-muted">
                The token may only see public repositories. Private repositories
                require a token with broader scope (e.g. <code>read:org</code> /
                repo access).
              </p>
            </div>
          )}

          {repositories.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative sm:max-w-xs sm:flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
                  <input
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Filter repositories"
                    aria-label="Filter repositories"
                    className="h-10 w-full rounded-xl border border-app-border bg-app-surface pl-9 pr-3 text-sm text-app-text outline-none transition placeholder:text-app-text-disabled focus:border-app-brand"
                  />
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <span className="text-app-text-muted">
                    {selectedCount} selected
                  </span>
                  <button
                    type="button"
                    onClick={toggleAllVisible}
                    disabled={selectableVisible.length === 0}
                    className="rounded-lg px-2 py-1 font-semibold text-app-brand-text transition hover:bg-app-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {allVisibleSelected ? "Clear all" : "Select all"}
                  </button>
                </div>
              </div>

              {selectedLinkCount > 0 && (
                <p className="rounded-xl border border-app-brand-border bg-app-brand-soft px-4 py-2.5 text-xs text-app-brand-text">
                  {selectedLinkCount} of the selected{" "}
                  {selectedLinkCount === 1 ? "repository is" : "repositories are"}{" "}
                  already ingested and will be linked to
                  {projectName ? ` ${projectName}` : " this project"} without
                  fetching or ingesting again.
                </p>
              )}

              <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                {filteredRepositories.map((repository) => {
                  const isSelected = selected.has(repository.name);
                  const linkState =
                    linkStateByName.get(repository.name) ?? "new";
                  const disabledRow = !isSelectable(repository.name);

                  return (
                    <li key={repository.name}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                          disabledRow
                            ? "cursor-not-allowed border-app-border bg-app-surface-muted opacity-70"
                            : isSelected
                              ? "border-app-brand bg-app-brand-soft shadow-sm"
                              : "border-app-border bg-app-surface hover:border-app-brand-border hover:bg-app-surface-hover"
                        }`}
                      >
                        <span className="relative flex shrink-0 items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={disabledRow}
                            onChange={() => toggleRepository(repository.name)}
                            className="peer sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-app-focus peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-app-surface ${
                              isSelected
                                ? "border-app-brand bg-app-brand text-white"
                                : "border-app-border-strong bg-app-surface"
                            } ${disabledRow ? "opacity-60" : ""}`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </span>
                        </span>

                        {repository.alreadyConnected && (
                          <span
                            role="img"
                            aria-label={
                              repository.isEnabled === false
                                ? "Disabled"
                                : "Enabled"
                            }
                            title={
                              repository.isEnabled === false
                                ? "Disabled"
                                : "Enabled"
                            }
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                              repository.isEnabled === false
                                ? "bg-app-text-disabled"
                                : "bg-app-success-solid"
                            }`}
                          />
                        )}

                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-text">
                          {repository.name}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                            repository.isPrivate
                              ? "border-app-orange-border bg-app-orange-bg text-app-orange-text"
                              : "border-app-success-border bg-app-success-bg text-app-success-text"
                          }`}
                        >
                          {repository.isPrivate && (
                            <Lock className="h-3 w-3" aria-hidden="true" />
                          )}
                          {repository.isPrivate ? "Private" : "Public"}
                        </span>

                        {linkState === "in-project" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-neutral-bg px-2 py-0.5 text-xs font-medium text-app-neutral-text">
                            <CheckCircle2
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            In this project
                          </span>
                        )}

                        {linkState === "linkable" && (
                          <span
                            title="Already ingested — adding it here reuses its artifacts instead of ingesting again."
                            className="inline-flex items-center gap-1 rounded-full border border-app-brand-border bg-app-brand-soft px-2 py-0.5 text-xs font-medium text-app-brand-text"
                          >
                            <CheckCircle2
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            Already ingested
                          </span>
                        )}

                        {linkState === "unresolved" && (
                          <span
                            title="Connected to another project, but its repository id could not be resolved."
                            className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-neutral-bg px-2 py-0.5 text-xs font-medium text-app-neutral-text"
                          >
                            <CheckCircle2
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            Connected
                          </span>
                        )}

                        <a
                          href={repository.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Open ${repository.name} on GitHub`}
                          className="text-app-text-muted transition hover:text-app-brand"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {hasMore && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => void runDiscovery(page + 1)}
                    disabled={discoverState === "loadingMore"}
                    className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {discoverState === "loadingMore" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <ComingSoonStep sourceSystem={selectedType} />
      )}
    </Modal>
  );
}

function SourceTypeStep({
  selectedType,
  onSelectType,
}: {
  selectedType: SourceSystem;
  onSelectType: (system: SourceSystem) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-app-text">Source type</p>

        {/* Each card carries its own description: the previous separate panel
            only ever described the selected type, so the differences between the
            options -- the actual decision being made here -- were invisible. */}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SOURCE_SYSTEMS.map((sourceSystem) => {
            const meta = SOURCE_META[sourceSystem];
            const Icon = meta.icon;
            const isSelected = selectedType === sourceSystem;
            const isAvailable = sourceSystem === "GITHUB";

            return (
              <button
                key={sourceSystem}
                type="button"
                onClick={() => onSelectType(sourceSystem)}
                className={`rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-app-brand bg-app-brand-soft"
                    : "border-app-border bg-app-surface hover:border-app-brand-border hover:bg-app-surface-hover"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-bg-soft">
                    <Icon
                      size={20}
                      className={
                        isSelected ? "text-app-brand" : "text-app-text-muted"
                      }
                    />
                  </div>

                  {!isAvailable && (
                    <span className="rounded-full bg-app-bg-soft px-2.5 py-1 text-xs font-medium text-app-text-subtle">
                      Soon
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm font-semibold text-app-text">
                  {meta.type}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-app-text-muted">
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Single-repository variant of the GitHub step. Mirrors the discovery step's
 * layout and controls (same field styling, same token picker, same guardrails)
 * so switching between the two feels like one flow rather than two dialogs.
 */
function SingleRepositoryStep({
  owner,
  repositoryName,
  tokenName,
  tokenNames,
  isBusy,
  canIngest,
  ingestBlockedReason,
  errorMessage,
  onOwnerChange,
  onRepositoryNameChange,
  onTokenNameChange,
  onSubmit,
}: {
  owner: string;
  repositoryName: string;
  tokenName: string;
  tokenNames: string[];
  isBusy: boolean;
  canIngest: boolean;
  ingestBlockedReason?: string;
  errorMessage: string | null;
  onOwnerChange: (value: string) => void;
  onRepositoryNameChange: (value: string) => void;
  onTokenNameChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const hasTokens = tokenNames.length > 0;
  const fieldClassName =
    "mt-2 h-11 w-full rounded-xl border border-app-border bg-app-surface px-4 text-sm text-app-text outline-none transition placeholder:text-app-text-disabled focus:border-app-brand disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {!canIngest && (
        <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-4 py-3 text-sm text-app-warning-text">
          {ingestBlockedReason ??
            "You can only connect sources to projects you manage."}
        </div>
      )}

      {!hasTokens && (
        <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg px-4 py-3 text-sm text-app-warning-text">
          Add a GitHub personal access token in Settings first, then come back to
          connect a repository.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="single-repo-owner"
            className="text-sm font-medium text-app-text"
          >
            Repository owner
          </label>
          <input
            id="single-repo-owner"
            value={owner}
            onChange={(event) => onOwnerChange(event.target.value)}
            disabled={isBusy || !hasTokens}
            placeholder="octocat or octocat/hello-world"
            className={fieldClassName}
          />
        </div>

        <div>
          <label
            htmlFor="single-repo-name"
            className="text-sm font-medium text-app-text"
          >
            Repository name
          </label>
          <input
            id="single-repo-name"
            value={repositoryName}
            onChange={(event) => onRepositoryNameChange(event.target.value)}
            disabled={isBusy || !hasTokens}
            placeholder="hello-world"
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="single-repo-token"
          className="text-sm font-medium text-app-text"
        >
          Access token
        </label>
        <select
          id="single-repo-token"
          value={tokenName}
          onChange={(event) => onTokenNameChange(event.target.value)}
          disabled={isBusy || !hasTokens}
          className="mt-2 h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition focus:border-app-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {hasTokens ? (
            tokenNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))
          ) : (
            <option value="">No saved tokens</option>
          )}
        </select>
      </div>

      <p className="text-xs text-app-text-subtle">
        Paste a full GitHub URL or <code>owner/name</code> into the owner field
        and the repository name is filled in for you.
      </p>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-2xl border border-app-danger-border bg-app-danger-bg px-4 py-3 text-sm text-app-danger-text">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </form>
  );
}

function ComingSoonStep({ sourceSystem }: { sourceSystem: SourceSystem }) {
  const meta = SOURCE_META[sourceSystem];
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-app-bg-soft">
        <Icon className="h-6 w-6 text-app-text-muted" />
      </div>
      <p className="mt-4 text-base font-semibold text-app-text">
        {meta.type} connection is coming soon
      </p>
      <p className="mx-auto mt-1 max-w-md text-sm text-app-text-muted">
        {meta.description} This source type isn&apos;t available to connect yet —
        for now you can connect GitHub repositories.
      </p>
    </div>
  );
}
