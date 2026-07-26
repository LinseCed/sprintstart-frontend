import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GitBranch,
  Loader2,
  Lock,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Modal } from "../../../components/ui/Modal.tsx";
import { ApiError } from "../../../services/apiClient.ts";
import {
  connectRepositories,
  discoverRepositories,
  type DiscoveredRepository,
  type DiscoveryOwnerType,
} from "../../../services/sources/githubService.ts";
import { parseGithubOwnerInput } from "../../../services/sources/githubRepositoryInput.ts";
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
  /** Switches to the single-repository fallback form. */
  onSwitchToSingleRepo: () => void;
};

type WizardStep = "type" | "detail";

const OWNER_TYPES: { value: DiscoveryOwnerType; label: string }[] = [
  { value: "auto", label: "Auto-detect" },
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
  onSwitchToSingleRepo,
}: AddSourceModalProps) {
  const hasTokens = tokenNames.length > 0;

  const [step, setStep] = useState<WizardStep>("type");
  const [selectedType, setSelectedType] = useState<SourceSystem>("GITHUB");

  const [ownerInput, setOwnerInput] = useState("");
  const [ownerType, setOwnerType] = useState<DiscoveryOwnerType>("auto");
  const [tokenName, setTokenName] = useState(tokenNames[0] ?? "");
  const [filter, setFilter] = useState("");

  // The owner that actually produced the current results, used at connect time
  // (discovered repos carry only their name, not their owner).
  const [resolvedOwner, setResolvedOwner] = useState("");
  const [repositories, setRepositories] = useState<DiscoveredRepository[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [effectiveOwnerType, setEffectiveOwnerType] =
    useState<DiscoveryOwnerType>("auto");

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
        setEffectiveOwnerType(result.resolvedOwnerType);
        setHasMore(result.hasMore);
        setPage(nextPage);
        setRepositories((current) =>
          loadingMore ? [...current, ...result.repositories] : result.repositories,
        );
        setDiscoverState("loaded");
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
    [ownerInput, ownerType, tokenName],
  );

  const filteredRepositories = useMemo(() => {
    const normalized = filter.trim().toLowerCase();
    if (!normalized) return repositories;

    return repositories.filter((repository) =>
      repository.name.toLowerCase().includes(normalized),
    );
  }, [filter, repositories]);

  const selectableVisible = filteredRepositories.filter(
    (repository) => !repository.alreadyConnected,
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

    try {
      await connectRepositories(
        chosen.map((repository) => ({
          owner: resolvedOwner,
          name: repository.name,
        })),
        tokenName.trim(),
        projectId,
      );

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

  const modalTitle =
    step === "type"
      ? "Add a data source"
      : isGithub
        ? "Discover GitHub repositories"
        : `Connect ${SOURCE_META[selectedType].type}`;

  const modalDescription =
    step === "type"
      ? projectName
        ? `Choose which source type to connect to ${projectName}.`
        : "Choose which source type you want to connect."
      : isGithub
        ? "Find and connect repositories from a GitHub organization or user."
        : undefined;

  return (
    <Modal
      isOpen
      title={modalTitle}
      description={modalDescription}
      size="xl"
      isDismissDisabled={connectState === "loading"}
      onClose={onClose}
      closeLabel="Close add source"
      bodyClassName="px-5 py-5 sm:px-7 sm:py-6"
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
              disabled={connectState === "loading"}
              className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={connectState === "loading"}
              className="rounded-xl border border-app-border bg-app-surface px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            {isGithub && (
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

          <button
            type="button"
            onClick={onSwitchToSingleRepo}
            className="text-sm font-medium text-app-brand-text underline decoration-app-brand-border underline-offset-4 transition hover:text-app-brand"
          >
            Add a single repository instead
          </button>

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
                    {selectedCount} selected · discovered as{" "}
                    {effectiveOwnerType === "user" ? "user" : "organization"}
                  </span>
                  <button
                    type="button"
                    onClick={toggleAllVisible}
                    disabled={selectableVisible.length === 0}
                    className="rounded-lg px-2 py-1 font-medium text-app-brand-text transition hover:bg-app-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {allVisibleSelected ? "Clear visible" : "Select visible"}
                  </button>
                </div>
              </div>

              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredRepositories.map((repository) => {
                  const isSelected = selected.has(repository.name);
                  const disabledRow = repository.alreadyConnected;

                  return (
                    <li key={repository.name}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                          disabledRow
                            ? "cursor-not-allowed border-app-border bg-app-surface-muted opacity-70"
                            : isSelected
                              ? "border-app-brand bg-app-brand-soft"
                              : "border-app-border bg-app-surface hover:border-app-brand-border"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={disabledRow}
                          onChange={() => toggleRepository(repository.name)}
                          className="h-4 w-4 shrink-0 accent-app-brand"
                        />

                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-text">
                          {repository.name}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                            repository.isPrivate
                              ? "border-app-border bg-app-neutral-bg text-app-neutral-text"
                              : "border-app-success-border bg-app-success-bg text-app-success-text"
                          }`}
                        >
                          {repository.isPrivate && (
                            <Lock className="h-3 w-3" aria-hidden="true" />
                          )}
                          {repository.isPrivate ? "Private" : "Public"}
                        </span>

                        {repository.alreadyConnected && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-app-brand-border bg-app-brand-soft px-2 py-0.5 text-xs font-medium text-app-brand-text">
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
  const selectedMeta = SOURCE_META[selectedType];
  const SelectedIcon = selectedMeta.icon;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-app-text">Source type</p>

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
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-app-border bg-app-surface-muted p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-bg-soft">
            <SelectedIcon size={20} className="text-app-text-muted" />
          </div>

          <div>
            <p className="text-sm font-semibold text-app-text">
              {selectedMeta.name}
            </p>
            <p className="mt-1 text-sm text-app-text-muted">
              {selectedMeta.description}
            </p>
          </div>
        </div>
      </div>
    </div>
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
