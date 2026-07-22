import { AlertTriangle, ArrowUpRight, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArtifactFilters,
  ArtifactList,
  ArtifactViewerDrawer,
} from "../../knowledge-base/components";
import { useKnowledgeBase } from "../../knowledge-base/hooks/useKnowledgeBase";
import { Pagination } from "../../../components/ui/Pagination";

type ArtifactsTabProps = {
  projectId: string | null;
};

/**
 * Artifacts view of the Data Ingestion page, deliberately aligned with the
 * Knowledge Base: it reuses the same unified-artifact hook and the KB filter /
 * list / viewer components so the two stay visually and behaviourally
 * consistent, and links out to the full Knowledge Base for browsing. This keeps
 * the ingestion page focused on "what was ingested" without duplicating the KB.
 */
export function ArtifactsTab({ projectId }: ArtifactsTabProps) {
  const {
    artifacts,
    isLoading,
    fetchError,
    fetchArtifacts,
    searchQuery,
    activeTab,
    currentPage,
    totalPages,
    filteredArtifacts,
    paginatedArtifacts,
    handleSearchChange,
    handleTabChange,
    setCurrentPage,
    handleClearFilters,
    hasActiveFilters,
  } = useKnowledgeBase(projectId);

  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(
    null,
  );
  const selectedArtifact = useMemo(
    () => artifacts.find((artifact) => artifact.id === selectedArtifactId) ?? null,
    [artifacts, selectedArtifactId],
  );

  if (!projectId) {
    return (
      <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
        <p className="text-sm text-app-text-muted">
          Select a project to browse ingested artifacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-app-text-muted">
          Artifacts ingested into this project&apos;s knowledge base.
        </p>

        <Link
          to="/knowledge-base"
          className="inline-flex items-center gap-1.5 rounded-lg px-1 text-sm font-medium text-app-brand-text underline decoration-app-brand-border underline-offset-4 transition hover:text-app-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
        >
          Open in Knowledge Base
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <ArtifactFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onRefresh={() => void fetchArtifacts()}
        isRefreshing={isLoading}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-app-text-muted">
          {filteredArtifacts.length}{" "}
          {filteredArtifacts.length === 1 ? "result" : "results"}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-sm font-medium text-app-brand hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {fetchError && !isLoading && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-app-danger-border bg-app-danger-bg p-4 text-app-danger-text"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{fetchError}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchArtifacts()}
            className="flex items-center gap-2 rounded-lg border border-app-danger-border px-3 py-1.5 text-sm font-medium hover:bg-app-surface-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div
          className="flex justify-center p-12"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-app-brand border-t-transparent" />
        </div>
      ) : fetchError ? null : (
        <>
          <ArtifactList
            artifacts={paginatedArtifacts}
            onSelect={setSelectedArtifactId}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-2"
            />
          )}
        </>
      )}

      <ArtifactViewerDrawer
        artifact={selectedArtifact}
        onClose={() => setSelectedArtifactId(null)}
        projectId={projectId}
      />
    </div>
  );
}
