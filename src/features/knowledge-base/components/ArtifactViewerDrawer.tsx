import { useEffect, useRef, useMemo, useCallback } from "react";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
  ArrowDown,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Artifact, ArtifactContent } from "../types";
import { useArtifactDrawerData } from "../hooks/useArtifactDrawerData";
import { shouldRenderAsMarkdown } from "../artifactPresentation";
import { findConnector } from "../../data-ingestion/connectors/registry";
import { formatLineRanges } from "../lineHighlight";
import {
  REHYPE_PLUGINS,
  REMARK_PLUGINS,
  createMarkdownComponents,
  staticMarkdownComponents,
} from "./markdownComponents";
import { languageForFilename } from "../sourceLanguage";
import { questionForArtifact, quoteForChat } from "../../../hooks/askAiQuote";
import { useArtifactSelection } from "../hooks/useArtifactSelection";
import { useAskAi } from "../../../hooks/useAskAi";
import { isEmptyContent, summariseBlockReason } from "../summarizability";
import { EmptyState } from "../../../components/ui/EmptyState";
import { preprocessMarkdown } from "../markdown";
import { getArtifactRepository } from "../githubMetadata";
import { knowledgeService } from "../../../services/knowledgeService";
import { RepositoryBadge } from "./RepositoryBadge";
import { SourceLinkBadge } from "./SourceLinkBadge";
import { useToast } from "../../../context/useToast";
import { Button } from "../../../components/ui/Button";
import { SidePanel } from "../../../components/ui/SidePanel";
import { Modal } from "../../../components/ui/Modal";
import { useAuth } from "../../../context/useAuth";
import { CitationsList } from "./CitationsList";
import { useDinoUnlocked, useSpaceOpensDino } from "../../easter-eggs/hooks/useDinoWaitingGame.ts";
import { DinoGameLazy } from "../../easter-eggs/components/DinoGameLazy.tsx";
import { DinoPlayHint } from "../../easter-eggs/components/DinoPlayHint.tsx";

/**
 * Props for the ArtifactViewerDrawer component.
 */
interface ArtifactViewerDrawerProps {
  artifact: Artifact | null;
  /** Closes the drawer and clears the selected artifact in the parent. */
  onClose: () => void;
  /** Project scope required to fetch the artifact content and summary. */
  projectId: string;
  /** Optional line numbers to highlight and scroll into view. */
  highlightLines?: number[];
  /** When true, renders the Delete button for UPLOAD-sourced artifacts. The
   *  parent gates this via accessPolicy Pattern A (PM/HR/ADMIN only). */
  canDelete: boolean;
  /** Called after a successful deletion so the parent can clear the selection
   *  and re-fetch the artifact list. */
  onDelete: (artifactId: string) => void;
  /** Whether to lock background scrolling while the drawer is open. Defaults to true. */
  lockScroll?: boolean;
}

/**
 * How the artifact's connector presents it, or undefined for a source system the
 * frontend does not know yet. Such an artifact is shown as plain content with its
 * source link and cannot be deleted.
 */
function knowledgeBaseOf(artifact: Artifact) {
  return findConnector(artifact.sourceSystem)?.knowledgeBase;
}

function rendersAsMarkdown(content: ArtifactContent | null, artifact: Artifact | null): boolean {
  const connectorRendersMarkdown =
    artifact !== null && knowledgeBaseOf(artifact)?.markdown === true;
  return shouldRenderAsMarkdown(content, artifact, connectorRendersMarkdown);
}

/**
 * ArtifactViewerDrawer
 *
 * Slide-out panel that displays the raw content of a selected artifact.
 * Allows users to trigger an AI summarization of the content to quickly extract key information
 * without reading massive files or issues. The summary is streamed over Server-Sent Events and
 * rendered incrementally as tokens arrive; citation metadata is rendered as a source list.
 */
export function ArtifactViewerDrawer({
  artifact,
  onClose,
  projectId,
  highlightLines,
  canDelete,
  onDelete,
  lockScroll = true,
}: ArtifactViewerDrawerProps) {
  const { profile } = useAuth();
  const toast = useToast();
  const skipContentLoad = Boolean(
    artifact && knowledgeBaseOf(artifact)?.metadataView?.appliesTo(artifact),
  );
  const { state, dispatch, summarize } = useArtifactDrawerData(
    artifact,
    projectId,
    skipContentLoad,
  );
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollToHighlightedChunk = useCallback(() => {
    if (!highlightLines || highlightLines.length === 0) return;
    const container = contentContainerRef.current;
    if (!container) return;

    const firstLine = Math.min(...highlightLines);
    const directLineEl = container.querySelector<HTMLElement>(`#line-${firstLine}`);
    if (directLineEl) {
      directLineEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const highlightedEl = container.querySelector<HTMLElement>("[data-highlighted='true']");
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const allLineElements = container.querySelectorAll<HTMLElement>("[data-line-start]");
    for (const el of allLineElements) {
      const start = Number(el.dataset.lineStart);
      const end = Number(el.dataset.lineEnd || start);
      if (firstLine >= start && firstLine <= end) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  }, [highlightLines]);

  useEffect(() => {
    if (
      highlightLines &&
      highlightLines.length > 0 &&
      state.viewMode === "raw" &&
      !state.isLoading &&
      state.content
    ) {
      // 120ms delay lets ReactMarkdown / SyntaxHighlighter finish rendering DOM nodes
      // before we try to scroll to one.
      const timer = setTimeout(() => {
        scrollToHighlightedChunk();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [
    highlightLines,
    state.viewMode,
    state.isLoading,
    state.content,
    state.markdownViewMode,
    scrollToHighlightedChunk,
  ]);

  const markdownComponents = useMemo(
    () => createMarkdownComponents(highlightLines),
    [highlightLines],
  );

  const {
    viewMode,
    markdownViewMode,
    content,
    summary,
    citations,
    isLoading,
    isFetchingSummary,
    isIndexing,
    isDeleting,
    isConfirmDeleteOpen,
    stageDetail,
    error,
  } = state;

  // The waiting game: Space while the summary streams — and, because this wait
  // runs minutes, the same opening behind a tap so it is not keyboard-only.
  // `artifact !== null` keeps the trigger disarmed while the drawer is closed
  // but its last summary state is still on the reducer (the stream aborts, the
  // flags stay); `viewMode === "summary"` keeps it disarmed on the raw view,
  // where the stream may still be running in the background — a Space press
  // there is a scroll, not an opening, and no game could be seen anyway.
  const dinoUnlocked = useDinoUnlocked();
  const [dinoActive, closeDino, openDino] = useSpaceOpensDino(
    isFetchingSummary && artifact !== null && viewMode === "summary",
    dinoUnlocked,
    { keepActiveUntilExit: true },
  );
  // The game's box lives in the summary view, so the game must leave with it.
  // `keepActiveUntilExit` deliberately keeps a run alive when the wait merely
  // ends, but these exits do not end the wait — the drawer can close (the
  // backdrop, the X, the page clearing its selection), "Back to File" flips
  // `viewMode` to raw, and selecting another artifact resets the reducer to
  // raw as well. The drawer never unmounts in any of them (both host pages
  // keep it mounted and toggle `artifact`), so without this the game would
  // hold the one shared slot invisibly — no other surface could ever open it
  // again, and a later summarise would resurrect the abandoned game.
  // Closing is the hook's own `close`, which frees the slot eagerly.
  useEffect(() => {
    if ((artifact === null || viewMode !== "summary") && dinoActive) {
      closeDino();
    }
  }, [artifact, viewMode, dinoActive, closeDino]);
  // Only the summary stream can set `error` while the summary view is up
  // (`summarizeStart` clears it and the retry loop keeps fetching), so the
  // game's badge can read a failure from it.
  const summaryFailed = !isFetchingSummary && error !== null;

  /**
   * Deletes the currently selected uploaded artifact.
   *
   * Confirms via an alertdialog before issuing the delete. The `removerId` is
   * the authenticated user's id; the backend uses it for audit and project-
   * membership validation. On success the parent `onDelete` callback clears
   * the selection and re-fetches the artifact list. Errors are surfaced in
   * the modal's own error slot (not the content-load error slot) so the
   * artifact view stays visible while the user retries.
   *
   * @remarks The delete endpoint expects the `UploadedArtifact`'s UUID, not
   * the ingestion `Artifact`'s UUID. The displayed artifact is usually the
   * ingestion mirror (its `id` is the ingestion UUID); the corresponding
   * `UploadedArtifact` id is carried in `artifact.sourceId`, which the backend
   * fills in from the upload row. When `sourceId` is missing (e.g. ingestion
   * mirror without a matching upload), deletion is refused with a user-facing
   * error.
   */
  const handleDelete = async () => {
    if (!artifact) return;
    const removerId = profile?.id;
    if (!removerId) {
      toast.error("Could not resolve the authenticated user id.");
      return;
    }
    const uploadArtifactId = artifact.sourceId;
    if (!uploadArtifactId) {
      toast.error("Couldn't resolve the uploaded artifact id for deletion.");
      return;
    }

    dispatch({ type: "deleteStart" });
    try {
      await knowledgeService.deleteUpload(projectId, uploadArtifactId, removerId);
      dispatch({ type: "deleteSuccess" });
      dispatch({ type: "closeDeleteConfirm" });
      onDelete(artifact.id);
      toast.success("Artifact deleted");
    } catch (err) {
      // Reset the deleting state (the reducer clears the flag) and surface the
      // reason as a toast; the confirm dialog stays open for a retry.
      const message = err instanceof Error ? err.message : "Couldn't delete the artifact.";
      dispatch({ type: "deleteFailed" });
      toast.error(message);
    }
  };

  /** Opens the delete confirmation, clearing any prior delete error. */
  const openDeleteConfirm = () => {
    dispatch({ type: "openDeleteConfirm" });
  };

  const titleContent =
    viewMode === "summary" ? (
      <button
        onClick={() => dispatch({ type: "showRaw" })}
        className="flex items-center gap-1 rounded-md border border-transparent p-1.5 text-sm font-medium text-app-text-muted transition-colors hover:border-app-border hover:bg-app-surface"
        data-testid="back-to-file-btn"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to File
      </button>
    ) : (
      <div className="line-clamp-1 text-lg font-semibold text-app-text">{artifact?.title}</div>
    );

  const canDeleteThisArtifact =
    canDelete && artifact !== null && knowledgeBaseOf(artifact)?.deletable === true;

  const isMarkdownArtifact = artifact && content ? rendersAsMarkdown(content, artifact) : false;

  const isPdfOrImage =
    content?.mimeType === "application/pdf" || (content?.mimeType.startsWith("image/") ?? false);
  const canHighlight = highlightLines && highlightLines.length > 0 && !isPdfOrImage;

  // A known-empty or near-empty artifact is refused before the round trip: the AI
  // service would index it first and only then answer that there is nothing to
  // summarise. Null while the content is still loading, or for formats that are
  // not text at all -- see summariseBlockReason.
  const askAi = useAskAi();

  /**
   * Whatever the reader has highlighted in the document, while they have it.
   *
   * The action below quotes it; with nothing selected it asks about the whole
   * artifact instead. The offer lives here rather than floating over the text,
   * because a button positioned over a selection covers the lines around it —
   * and the lines around a selection are usually the next thing being read.
   */
  const selection = useArtifactSelection(contentContainerRef);

  const ask = () => {
    const prompt = selection.text
      ? quoteForChat({
          text: selection.text,
          source: artifact?.title ?? null,
          url: artifact?.sourceUrl ?? null,
        })
      : questionForArtifact({ title: artifact?.title, url: artifact?.sourceUrl });

    if (askAi(prompt)) selection.clear();
  };

  const summariseBlockedReason = summariseBlockReason(content);

  // The connector's own view for an artifact that has no content to fetch.
  const metadataView = artifact ? knowledgeBaseOf(artifact)?.metadataView : undefined;
  const MetadataView = artifact && metadataView?.appliesTo(artifact) ? metadataView.View : null;

  const actionsContent = viewMode === "raw" && !MetadataView && (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      {isMarkdownArtifact && content && (
        <div className="flex items-center rounded-lg border border-app-border bg-app-bg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => dispatch({ type: "setMarkdownViewMode", mode: "rendered" })}
            className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors ${
              markdownViewMode === "rendered"
                ? "bg-app-surface text-app-brand-text shadow-xs"
                : "text-app-text-muted hover:text-app-text"
            }`}
            data-testid="view-rendered-btn"
          >
            Formatted
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: "setMarkdownViewMode", mode: "source" })}
            className={`cursor-pointer rounded-md px-2.5 py-1 font-medium transition-colors ${
              markdownViewMode === "source"
                ? "bg-app-surface text-app-brand-text shadow-xs"
                : "text-app-text-muted hover:text-app-text"
            }`}
            data-testid="view-source-btn"
          >
            Source
          </button>
        </div>
      )}
      <Button
        variant="secondary"
        size="sm"
        onClick={ask}
        data-testid="ask-ai-btn"
        icon={<MessageSquare className="h-4 w-4" />}
      >
        {selection.text ? "Ask AI about this" : "Ask AI"}
      </Button>
      {/* The wrapper carries the reason, not the button: a disabled control
          receives no pointer events, so its own title would never be shown. */}
      <span title={summariseBlockedReason ?? undefined}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void summarize()}
          disabled={summariseBlockedReason !== null}
          // Keeps the reason reachable without sight; the accessible name still
          // begins with the visible label.
          aria-label={
            summariseBlockedReason
              ? `Summarise (unavailable: ${summariseBlockedReason})`
              : undefined
          }
          data-testid="summarise-btn"
          icon={<Sparkles className="h-4 w-4" />}
        >
          Summarise
        </Button>
      </span>
      {canDeleteThisArtifact && (
        <button
          onClick={openDeleteConfirm}
          data-testid="delete-artifact-btn"
          disabled={isDeleting}
          className="flex items-center gap-2 rounded-md border border-app-danger-border bg-app-danger-bg px-3 py-1.5 text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-text/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      )}
    </div>
  );

  // GitHub repo artifacts show their `owner/repository` in the header's badge
  // row; other kinds have no repository to name, so the badge stays unset.
  const repository = artifact ? getArtifactRepository(artifact) : null;
  const hasSourceLink =
    Boolean(artifact?.sourceUrl?.trim()) &&
    artifact !== null &&
    knowledgeBaseOf(artifact)?.linkLabel !== null;

  const headerBadge =
    repository || hasSourceLink ? (
      <>
        {repository && (
          <RepositoryBadge repository={repository} testId="artifact-drawer-repo-badge" />
        )}
        {hasSourceLink && artifact?.sourceUrl && (
          <SourceLinkBadge
            sourceUrl={artifact.sourceUrl}
            sourceSystem={artifact.sourceSystem}
            testId="artifact-drawer-source-link"
          />
        )}
      </>
    ) : undefined;

  return (
    <SidePanel
      isOpen={!!artifact}
      onClose={onClose}
      title={titleContent}
      badge={headerBadge}
      actions={actionsContent}
      widthClassName="w-full max-w-5xl"
      zIndexClassName="z-50"
      // The `!` is load-bearing: Tailwind emits `sm:` utilities after `max-*` variants, so a
      // plain `max-[1025px]:rounded-none` would lose to the SidePanel's `sm:rounded-l-[28px]`.
      // The bound is 1025, not `lg`'s 1024, because this drawer is `w-full max-w-5xl`: at a
      // 1024px window — an iPad on its side — it is still full-bleed, and a corner there would
      // notch against the viewport. From 1025 up the page shows beside it and the corner stands.
      panelClassName="border-l border-app-border shadow-2xl max-[1025px]:rounded-none!"
      panelBackgroundClassName="bg-app-surface"
      headerClassName="p-4 bg-app-bg"
      contentClassName="p-6"
      lockScroll={lockScroll}
    >
      {error && viewMode === "raw" ? (
        <div className="rounded-2xl border border-app-danger-border bg-app-danger-bg p-4 text-app-danger-text">
          <p className="font-medium">Error loading content</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : viewMode === "raw" && MetadataView && artifact ? (
        <div data-testid="raw-content" aria-busy={false}>
          <MetadataView artifact={artifact} />
        </div>
      ) : viewMode === "raw" ? (
        <div ref={contentContainerRef} data-testid="raw-content" aria-busy={isLoading}>
          {isLoading ? (
            <div className="animate-pulse space-y-4 motion-reduce:animate-none">
              <div className="h-4 w-3/4 rounded bg-app-border"></div>
              <div className="h-4 w-1/2 rounded bg-app-border"></div>
              <div className="h-4 w-5/6 rounded bg-app-border"></div>
              <div className="h-4 w-2/3 rounded bg-app-border"></div>
            </div>
          ) : (
            <>
              {canHighlight && (
                <div
                  data-testid="cited-chunk-banner"
                  className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-app-brand-border bg-app-brand-soft/90 px-3.5 py-2 text-xs font-medium text-app-brand-text shadow-xs dark:border-app-brand/40 dark:bg-app-brand/20"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 shrink-0 text-app-brand" />
                    <span>Showing cited chunk ({formatLineRanges(highlightLines)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToHighlightedChunk}
                    data-testid="jump-to-chunk-btn"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-app-brand-border bg-app-surface px-2.5 py-1 text-xs font-semibold text-app-brand-text shadow-xs transition-colors hover:bg-app-surface-hover hover:text-app-brand"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    Jump to chunk
                  </button>
                </div>
              )}
              {content && isEmptyContent(content) ? (
                <div data-testid="empty-body-notice">
                  <EmptyState size="sm" title="Nothing to read here">
                    This artifact came in with a title and an empty body — a pull request or issue
                    whose description was never written, or a file with no content. There is nothing
                    to read, and nothing to summarise.
                  </EmptyState>
                </div>
              ) : content &&
                rendersAsMarkdown(content, artifact) &&
                markdownViewMode === "rendered" ? (
                <div className="prose prose-sm max-w-none break-words text-app-text dark:prose-invert">
                  <ReactMarkdown
                    remarkPlugins={REMARK_PLUGINS}
                    rehypePlugins={REHYPE_PLUGINS}
                    components={markdownComponents}
                  >
                    {preprocessMarkdown(content.content)}
                  </ReactMarkdown>
                </div>
              ) : content?.mimeType === "application/pdf" ? (
                <div className="h-[calc(100vh-12rem)] min-h-[500px] w-full overflow-hidden rounded-lg border border-app-border">
                  <object data={content.content} type="application/pdf" className="h-full w-full">
                    <p className="p-4 text-app-text-muted">
                      Unable to display PDF file.{" "}
                      <a
                        href={content.content}
                        download={artifact?.title || "document.pdf"}
                        className="text-app-brand underline underline-offset-2"
                      >
                        Download
                      </a>{" "}
                      instead.
                    </p>
                  </object>
                </div>
              ) : content?.mimeType.startsWith("image/") ? (
                <div className="flex justify-center rounded-2xl border border-app-border bg-app-bg p-4">
                  <img
                    src={content.content}
                    alt={artifact?.title || "Image"}
                    className="max-w-full rounded shadow-sm"
                  />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-app-border text-sm">
                  <SyntaxHighlighter
                    language={
                      isMarkdownArtifact ? "markdown" : languageForFilename(artifact?.title)
                    }
                    style={vscDarkPlus}
                    showLineNumbers={true}
                    wrapLines={true}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      backgroundColor: "var(--color-app-bg)",
                    }}
                    lineProps={(lineNumber) => ({
                      style: { display: "block", padding: "0 4px" },
                      className: highlightLines?.includes(lineNumber)
                        ? "bg-app-brand/30 border-l-2 border-app-brand"
                        : "",
                      id: `line-${lineNumber}`,
                    })}
                  >
                    {content?.content || ""}
                  </SyntaxHighlighter>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div data-testid="summary-content" className="max-w-none">
          <div className="mb-6 flex items-center gap-2 border-b border-app-border pb-4 font-medium text-app-brand">
            <Sparkles className="h-5 w-5" />
            <span className="text-lg">AI Summary</span>
          </div>

          {dinoUnlocked && isFetchingSummary && !dinoActive && (
            <DinoPlayHint onPlay={openDino} className="mb-4" />
          )}

          {dinoActive && (
            <div className="mb-4">
              <DinoGameLazy
                onExit={closeDino}
                // The badge may only claim the state the summary actually
                // reached, and only once nothing is in flight.
                replyReady={dinoActive && !isFetchingSummary}
                completionLabel={summaryFailed ? "Summary failed" : "Summary ready"}
                completionTone={summaryFailed ? "danger" : "success"}
              />
            </div>
          )}

          {!summary && isFetchingSummary ? (
            <div
              className="flex items-center justify-center gap-3 py-8 text-app-text-muted"
              aria-live="polite"
            >
              <Loader2 className="h-5 w-5 animate-spin text-app-brand" />
              <span className="text-base font-medium">
                {stageDetail
                  ? stageDetail
                  : isIndexing
                    ? "Preparing summary..."
                    : "Generating summary..."}
              </span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="max-w-sm text-center text-sm text-app-text-muted">{error}</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  onClick={() => void summarize()}
                  data-testid="retry-summary-btn"
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Retry
                </Button>
                <button
                  onClick={() => dispatch({ type: "showRaw" })}
                  className="flex items-center gap-2 rounded-md border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-muted"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to File
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="prose prose-sm max-w-none break-words text-app-text dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={REMARK_PLUGINS}
                  rehypePlugins={REHYPE_PLUGINS}
                  components={staticMarkdownComponents()}
                >
                  {preprocessMarkdown(summary)}
                </ReactMarkdown>
              </div>

              {citations.length > 0 && <CitationsList citations={citations} />}
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => dispatch({ type: "closeDeleteConfirm" })}
        role="alertdialog"
        title="Delete artifact?"
        description={`This will permanently remove "${artifact?.title ?? "this artifact"}" and its indexed content. This cannot be undone.`}
        size="sm"
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => dispatch({ type: "closeDeleteConfirm" })}
            disabled={isDeleting}
            data-testid="cancel-delete-btn"
            className="rounded-lg border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            data-testid="confirm-delete-btn"
            className="flex items-center gap-2 rounded-lg bg-app-danger-text px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>
    </SidePanel>
  );
}
