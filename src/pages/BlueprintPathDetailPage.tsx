import { MainContent } from "../components/layout/MainContent";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Link, ListChecks, Loader2, TriangleAlert } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button.tsx";
import { SegmentedTabs } from "../components/ui/SegmentedTabs.tsx";
import { useSwipeableTabs } from "../hooks/useHorizontalWheelNavigation.ts";
import type { BlueprintOption, BlueprintPath } from "../features/blueprints/types.ts";
import { BlueprintGraphEditor } from "../features/blueprints/components/BlueprintGraphEditor.tsx";
import { BlueprintSubGraphEditor } from "../features/blueprints/components/BlueprintSubGraphEditor.tsx";
import { blueprintService, type BlueprintScope } from "../services/blueprintService.ts";
import { useProjectContext } from "../features/projects/useProjectContext.ts";
import { useAuth } from "../context/useAuth.ts";

import {
  EDITOR_MODE_ORDER,
  type CreateKind,
  type EditTarget,
  type EditorMode,
} from "../features/blueprints/pathEditorTypes.ts";
import { withGraphNodes } from "../features/blueprints/withGraphNodes.ts";
import {
  ArchiveDialog,
  DeleteItemDialog,
  DraftPromptDialog,
  LifecycleDialog,
} from "../features/blueprints/components/BlueprintPathDialogs.tsx";
import { BlueprintPathHeader } from "../features/blueprints/components/BlueprintPathHeader.tsx";
import { AddRequirementsModal } from "../features/blueprints/components/AddRequirementsModal.tsx";
import {
  useAddRequirements,
  useRemoveRequirement,
} from "../features/blueprints/useRequirementEdits.ts";
import { useRequirementPicker } from "../features/blueprints/useRequirementPicker.ts";
import { VersionHistoryModal } from "../features/blueprints/components/VersionHistoryModal.tsx";
import { blueprintAddress, type PathPageContext } from "../features/blueprints/pathPageContext.ts";
import { useArchive, useLifecycleActions } from "../features/blueprints/useLifecycleActions.ts";
import { useDraftPrompt, useEditAsDraft } from "../features/blueprints/useDraftPrompt.ts";
import { useVersionHistory } from "../features/blueprints/useVersionHistory.ts";
import { ItemFormModal } from "../features/blueprints/components/ItemFormModal.tsx";
import { useOutlineOrder } from "../features/blueprints/useOutlineOrder.ts";
import { useItemForm, useSaveItem } from "../features/blueprints/useItemForm.ts";
import { BlueprintOutline } from "../features/blueprints/components/outline/BlueprintOutline.tsx";
import type { OutlineActions } from "../features/blueprints/components/outline/outlineActions.ts";
import { useCollapsedIds } from "../features/blueprints/useCollapsedIds.ts";
import { useEditorMode } from "../features/blueprints/useEditorMode.ts";
import { usePhaseGraphEdits } from "../features/blueprints/usePhaseGraphEdits.ts";
import {
  useSubGraphContentEdits,
  useSubGraphNodeEdits,
  useSubGraphState,
} from "../features/blueprints/useSubGraph.ts";
import { useDeleteConfirmation, useDeleteItem } from "../features/blueprints/useItemDeletion.ts";
import { LifecycleNotice } from "../features/blueprints/components/LifecycleNotice.tsx";

/**
 * Authors one Blueprint path and its reusable phases, content, and knowledge checks.
 *
 * Bound to `/blueprints/:pathId`, which shares the `/blueprints` policy entry: open to `PM`,
 * `HR` and `ADMIN`, wrapped in `ManagerAreaGuard`, so a PM must manage the selected project.
 * The path belongs to the selected project, or to the global scope with `?scope=global`,
 * which only an `ADMIN` gets. `location.state.reopen` asks the page to open a phase or node by
 * itself once the path has loaded.
 */
export function BlueprintPathDetailPage() {
  const { pathId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { selectedProjectId, isLoading: isProjectLoading } = useProjectContext();
  const isGlobal = searchParams.get("scope") === "global" && profile?.permissionGroup === "ADMIN";
  const blueprintScope = useMemo<BlueprintScope>(
    () => (isGlobal ? { kind: "global" } : { kind: "project", projectId: selectedProjectId }),
    [isGlobal, selectedProjectId],
  );
  const blueprintListPath = isGlobal ? "/blueprints?scope=global" : "/blueprints";
  const projectIdAtMount = useRef<string | null>(null);
  const [path, setPath] = useState<BlueprintPath | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requirementPicker = useRequirementPicker();
  const editContext = { path, setPath, scope: blueprintScope, setPageError: setError };
  const addRequirements = useAddRequirements(editContext, requirementPicker);
  const removeRequirement = useRemoveRequirement(editContext);
  /**
   * Loads the path together with its graph, and merges the two.
   *
   * The two requests are one fact. `GET /paths/{id}` returns phases without `graphX`, `graphY` or
   * `blockerIds` — `GetBlueprintPhaseResponse` simply has no such fields, while the nested *step*
   * response does — so a path loaded on its own describes every phase as never placed, and the
   * canvas drawn from it is empty. That is what made the graph vanish after "Edit as draft" (which
   * navigates to the new draft's id) and after Publish (which replaces the path with a fresh DTO),
   * and why a reload appeared to fix it: a reload starts in list mode, and the graph was fetched
   * again on the way back.
   *
   * Merging here rather than at each call site means no caller can forget.
   *
   * TODO(backend): the three fields on the nested phase response would remove the second request
   * entirely.
   */
  const loadPath = useCallback(
    async (showLoading = true) => {
      if (!pathId) return;
      if (showLoading) setIsLoading(true);
      setError(null);
      try {
        const [nextPath, graph] = await Promise.all([
          blueprintService.getPath(blueprintScope, pathId),
          blueprintService.getGraph(blueprintScope, pathId),
        ]);
        setPath(withGraphNodes(nextPath, graph.nodes));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Blueprint path could not be loaded.");
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [blueprintScope, pathId],
  );

  const pageContext: PathPageContext = {
    path,
    setPath,
    pathId,
    scope: blueprintScope,
    isGlobal,
    listPath: blueprintListPath,
    navigate,
    loadPath,
    setPageError: setError,
  };
  const history = useVersionHistory(pageContext);
  const lifecycle = useLifecycleActions(pageContext, history);
  const archive = useArchive(pageContext);
  const draftPrompt = useDraftPrompt(pageContext);
  const editAsDraft = useEditAsDraft(pageContext);
  const { isDraft, whenEditable, openDraftAndContinue } = draftPrompt;
  const subGraph = useSubGraphState(pageContext);
  const phaseGraph = usePhaseGraphEdits(pageContext);
  const nodeEdits = useSubGraphNodeEdits(pageContext, subGraph);
  const contentEdits = useSubGraphContentEdits(pageContext, subGraph);
  const editor = useEditorMode(pageContext, subGraph);
  const { refreshActiveEditorData } = editor;
  const { deletingId, deleteItem } = useDeleteItem(pageContext, subGraph, refreshActiveEditorData);
  const deletion = useDeleteConfirmation(whenEditable, deleteItem);
  const requestDelete = deletion.request;
  // Two-finger swipe between the two editors, the same gesture the admin and inbox pages use.
  const swipeRef = useSwipeableTabs<EditorMode, HTMLElement>({
    order: EDITOR_MODE_ORDER,
    value: editor.mode,
    onChange: editor.changeEditorMode,
  });
  const phasesCollapsed = useCollapsedIds();
  const stepsCollapsed = useCollapsedIds();
  const questionsCollapsed = useCollapsedIds();
  const { dragProps } = useOutlineOrder({
    path,
    setPath,
    scope: blueprintScope,
    loadPath,
    setPageError: setError,
    whenEditable,
  });
  const itemForm = useItemForm();
  const saveItem = useSaveItem(itemForm, {
    scope: blueprintScope,
    setPath,
    setPageError: setError,
    refresh: refreshActiveEditorData,
    placeStep: nodeEdits.appendStep,
    placeQuestion: nodeEdits.appendQuestion,
  });

  useEffect(() => {
    if (!isGlobal) {
      if (isProjectLoading) return;
      if (!selectedProjectId) {
        void navigate("/blueprints", { replace: true });
        return;
      }
      if (projectIdAtMount.current === null) {
        projectIdAtMount.current = selectedProjectId;
      } else if (projectIdAtMount.current !== selectedProjectId) {
        projectIdAtMount.current = selectedProjectId;
        void navigate("/blueprints", { replace: true });
        return;
      }
    }
    void loadPath();
  }, [isGlobal, isProjectLoading, loadPath, navigate, selectedProjectId]);

  function openCreate(
    kind: CreateKind,
    parentId: string,
    position: number,
    graphPosition?: { graphX: number; graphY: number },
  ) {
    // Every "Add …" lands here. On a published version, offer the draft rather than a form whose
    // save can only come back refused.
    if (!isDraft) {
      whenEditable(() => undefined);
      return;
    }
    itemForm.openCreate({ kind, parentId, position, graphPosition });
  }

  /**
   * Asks first, like the identical control in the outline. The dialog then owns the request, its
   * failure and the refresh, through `deleteItem`.
   */
  function removeQuestionOption(option: BlueprintOption) {
    requestDelete("option", option.id, option.label);
    return Promise.resolve();
  }

  /** A graph edit asked for from the outline: made on a draft, and offered as one on anything else. */
  function runGraphEdit(edit: () => Promise<void>): Promise<void> {
    if (isDraft) return edit();
    whenEditable(() => undefined);
    return Promise.resolve();
  }

  /** Opens the overlay on an existing item, seeded with whatever that kind of item actually has. */
  function openEdit(nextTarget: NonNullable<EditTarget>) {
    setError(null);
    itemForm.openEdit(nextTarget);
  }

  // Keep the existing shell visible during a graph → list refresh. This avoids replacing the
  // whole page with a loading state while the nested DTO catches up with graph revisions.
  //
  // A path from a *different* address is a different matter: during a walk between versions, the
  // one being left stayed fully interactive under the new URL, so Publish published it and the
  // header described it. The `reopen` effect guards this the same way.
  if (isLoading && (!path || path.id !== pathId))
    return (
      <MainContent
        placeholder
        className="flex min-h-80 items-center justify-center gap-3 text-app-text-muted"
      >
        <Loader2 className="h-5 w-5 animate-spin" /> Loading blueprint…
      </MainContent>
    );
  if (!path)
    return (
      <MainContent className="mx-auto max-w-3xl p-8">
        <Button
          variant="secondary"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => void navigate(blueprintListPath)}
        >
          Back to blueprints
        </Button>
        <p role="alert" className="mt-6 flex items-start gap-1.5 text-app-danger-text">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error || "Blueprint path not found."}
        </p>
      </MainContent>
    );

  const outlineActions: OutlineActions = {
    dragProps,
    whenEditable,
    openEdit,
    openCreate,
    requestDelete,
    deletingId,
    openInGraph: (phaseTitle) => {
      editor.setOpenPhaseTitle(phaseTitle);
      editor.changeEditorMode("graph");
    },
    addBlocker: phaseGraph.addBlocker,
    removeBlocker: phaseGraph.removeBlocker,
    runGraphEdit,
    openRequirementPicker: (phaseId) => void requirementPicker.open(phaseId),
    removeRequirement: (phaseId, requirementId) =>
      void removeRequirement.remove(phaseId, requirementId),
    removingRequirementId: removeRequirement.removingId,
    phasesCollapsed,
    stepsCollapsed,
    questionsCollapsed,
  };

  const orderedPhases = [...path.blueprintPhases].sort((a, b) => a.position - b.position);
  const subGraphPhase = subGraph.phaseId
    ? (path.blueprintPhases.find((phase) => phase.id === subGraph.phaseId) ?? null)
    : null;

  return (
    <div className="min-h-screen">
      <DeleteItemDialog
        pendingDelete={deletion.pending}
        deletingId={deletingId}
        error={deletion.error}
        onCancel={deletion.cancel}
        onConfirm={deletion.confirm}
      />
      <DraftPromptDialog
        path={path}
        isOpen={draftPrompt.isOpen}
        isBusy={draftPrompt.isOpening}
        error={draftPrompt.error}
        onClose={draftPrompt.close}
        onConfirm={() => {
          if (path.status === "ARCHIVED") {
            draftPrompt.close();
            return;
          }
          void openDraftAndContinue(null);
        }}
      />
      <ArchiveDialog
        isOpen={archive.isConfirmOpen}
        isBusy={archive.isArchiving}
        onClose={archive.cancel}
        onConfirm={() => void archive.archive()}
      />
      <LifecycleDialog
        pending={lifecycle.pending}
        isBusy={lifecycle.isBusy}
        error={lifecycle.error}
        onCancel={lifecycle.cancel}
        onConfirm={() => void lifecycle.run()}
      />
      <BlueprintPathHeader
        path={path}
        isArchiving={archive.isArchiving}
        isLifecycleBusy={lifecycle.isBusy}
        onBack={() => void navigate(blueprintListPath)}
        onOpenHistory={() => void history.open()}
        onArchive={archive.ask}
        onEditAsDraft={() => void editAsDraft()}
        onRevert={() => lifecycle.request({ action: "rollback", version: path })}
        onPublish={() => lifecycle.request({ action: "publish", version: path })}
      />

      {/* The swipe listens on the page body, not on the bar: a gesture that only works while the
          pointer is over a 20rem control reads as broken everywhere else. */}
      <MainContent ref={swipeRef} className="app-page-frame space-y-7 py-6 lg:py-8">
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-1.5 rounded-xl bg-app-danger-bg p-4 text-sm text-app-danger-text"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}
        <LifecycleNotice status={path.status} version={path.version} />
        <SegmentedTabs
          value={editor.mode}
          options={[
            {
              value: "list",
              label: "Outline",
              icon: <ListChecks className="h-4 w-4" />,
            },
            {
              value: "graph",
              label: "Graph",
              icon: <Link className="h-4 w-4" />,
            },
          ]}
          onChange={editor.changeEditorMode}
          layoutId="blueprint-editor-mode-pill"
          ariaLabel="Blueprint view"
        />
        {editor.mode === "graph" ? (
          subGraphPhase ? (
            <BlueprintSubGraphEditor
              phase={subGraphPhase}
              nodes={subGraph.nodes}
              editable={path.status === "DRAFT"}
              onRequestDraft={(node) =>
                void openDraftAndContinue({
                  phaseTitle: subGraphPhase.title,
                  nodeTitle: node.title,
                })
              }
              openNodeTitle={editor.openNodeTitle}
              onOpenedNode={() => editor.setOpenNodeTitle(null)}
              onBack={() => void editor.returnToTopLevelGraph()}
              onPositionChange={nodeEdits.savePosition}
              onAddBlocker={nodeEdits.addBlocker}
              onRemoveBlocker={nodeEdits.removeBlocker}
              onCreateNode={(kind, graphX, graphY) => {
                openCreate(
                  kind,
                  subGraphPhase.id,
                  kind === "step"
                    ? subGraphPhase.blueprintSteps.length
                    : subGraphPhase.blueprintCheckQuestions.length,
                  { graphX, graphY },
                );
                return Promise.resolve();
              }}
              onUpdateQuestion={contentEdits.updateQuestion}
              onAddOption={contentEdits.addOption}
              onRemoveOption={removeQuestionOption}
              onUpdateStep={contentEdits.updateStep}
              onAddTask={(step) => openCreate("task", step.id, step.blueprintTasks.length)}
              onRemoveTask={(task) => requestDelete("task", task.id, task.title)}
              onAddResource={(step) =>
                openCreate("resource", step.id, step.blueprintResources.length)
              }
              onRemoveResource={(resource) =>
                requestDelete("resource", resource.id, resource.title)
              }
              onEditTask={(task) => openEdit({ kind: "task", item: task })}
              onEditResource={(resource) => openEdit({ kind: "resource", item: resource })}
              onEditOption={(option) => openEdit({ kind: "option", item: option })}
              onDeleteStep={(step) => deleteItem("step", step.id)}
              onDeleteQuestion={(question) => deleteItem("question", question.id)}
            />
          ) : (
            <BlueprintGraphEditor
              // In the author's own order, which is what the graph falls back to when it steps from
              // an opened phase to the one either side of it and there is no arrow to follow.
              phases={orderedPhases}
              pathTitle={path.title}
              editable={path.status === "DRAFT"}
              onRequestDraft={(phase) => void openDraftAndContinue({ phaseTitle: phase.title })}
              openPhaseTitle={editor.openPhaseTitle}
              onOpenedPhase={() => editor.setOpenPhaseTitle(null)}
              onPositionChange={phaseGraph.savePosition}
              onAddBlocker={phaseGraph.addBlocker}
              onRemoveBlocker={phaseGraph.removeBlocker}
              onCreateNode={(graphX: number, graphY: number) => {
                openCreate("phase", path.id, path.blueprintPhases.length, {
                  graphX,
                  graphY,
                });
                return Promise.resolve();
              }}
              onDeletePhase={(phase) => deleteItem("phase", phase.id)}
              onOpenSubGraph={(phase) => void subGraph.open(phase)}
              onUpdatePhase={phaseGraph.updateMetadata}
            />
          )
        ) : (
          <BlueprintOutline path={path} actions={outlineActions} />
        )}
        <AddRequirementsModal
          picker={requirementPicker}
          phase={path.blueprintPhases.find((item) => item.id === requirementPicker.target?.phaseId)}
          isSaving={addRequirements.isSaving}
          onSubmit={(event) => void addRequirements.submit(event)}
        />
        <VersionHistoryModal
          history={history}
          lifecycle={lifecycle}
          onOpenVersion={(version) => {
            history.close();
            void navigate(blueprintAddress(version.id, isGlobal));
          }}
        />
        <ItemFormModal form={itemForm} onSubmit={(event) => void saveItem(event)} />
      </MainContent>
    </div>
  );
}
