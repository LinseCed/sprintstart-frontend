import { MainContent } from "../components/layout/MainContent";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { ArrowLeft, Link, ListChecks, Loader2, TriangleAlert } from "lucide-react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button.tsx";
import { SegmentedTabs } from "../components/ui/SegmentedTabs.tsx";
import { useSwipeableTabs } from "../hooks/useHorizontalWheelNavigation.ts";
import type {
  BlueprintOption,
  BlueprintGraphNode,
  BlueprintPhase,
  BlueprintPath,
  BlueprintQuestion,
  BlueprintStep,
} from "../features/blueprints/types.ts";
import {
  BlueprintGraphEditor,
  type BlueprintPhaseMetadata,
} from "../features/blueprints/components/BlueprintGraphEditor.tsx";
import { BlueprintSubGraphEditor } from "../features/blueprints/components/BlueprintSubGraphEditor.tsx";
import type {
  BlueprintQuestionMetadata,
  BlueprintStepMetadata,
} from "../features/blueprints/components/BlueprintSubGraphEditor.tsx";
import { blueprintService, type BlueprintScope } from "../services/blueprintService.ts";
import { useProjectContext } from "../features/projects/useProjectContext.ts";
import { useAuth } from "../context/useAuth.ts";

import {
  EDITOR_MODE_ORDER,
  type BlueprintReopen,
  type CreateKind,
  type EditTarget,
  type EditorMode,
  type SortKind,
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
import { useItemForm, useSaveItem } from "../features/blueprints/useItemForm.ts";
import { BlueprintOutline } from "../features/blueprints/components/outline/BlueprintOutline.tsx";
import type { OutlineActions } from "../features/blueprints/components/outline/outlineActions.ts";
import { useCollapsedIds } from "../features/blueprints/useCollapsedIds.ts";
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
  const location = useLocation();
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
  const [subGraphPhaseId, setSubGraphPhaseId] = useState<string | null>(null);
  /** A phase or node the graph should open by itself, once it has it. See {@link BlueprintReopen}. */
  const [pendingOpenPhaseTitle, setPendingOpenPhaseTitle] = useState<string | null>(null);
  const [pendingOpenNodeTitle, setPendingOpenNodeTitle] = useState<string | null>(null);
  const [subGraphNodes, setSubGraphNodes] = useState<BlueprintGraphNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<{ kind: SortKind; id: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    kind: CreateKind;
    id: string;
    label: string;
  } | null>(null);
  const [pendingDeleteError, setPendingDeleteError] = useState<string | null>(null);
  const requirementPicker = useRequirementPicker();
  const editContext = { path, setPath, scope: blueprintScope, setPageError: setError };
  const addRequirements = useAddRequirements(editContext, requirementPicker);
  const removeRequirement = useRemoveRequirement(editContext);
  const [editorMode, setEditorMode] = useState<EditorMode>("list");
  // Two-finger swipe between the two editors, the same gesture the admin and inbox pages use.
  const swipeRef = useSwipeableTabs<EditorMode, HTMLElement>({
    order: EDITOR_MODE_ORDER,
    value: editorMode,
    onChange: (mode) => changeEditorMode(mode),
  });

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
  const phasesCollapsed = useCollapsedIds();
  const stepsCollapsed = useCollapsedIds();
  const questionsCollapsed = useCollapsedIds();
  const itemForm = useItemForm();
  const saveItem = useSaveItem(itemForm, {
    scope: blueprintScope,
    setPath,
    setPageError: setError,
    refresh: refreshActiveEditorData,
    placeStep: appendCreatedSubGraphStep,
    placeQuestion: appendCreatedSubGraphQuestion,
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

  function updateGraphPhase(phaseId: string, update: Partial<BlueprintPhase>) {
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases.map((phase) =>
              phase.id === phaseId ? { ...phase, ...update } : phase,
            ),
          }
        : current,
    );
  }

  async function saveGraphPosition(phase: BlueprintPhase, graphX: number, graphY: number) {
    const response = await blueprintService.updateGraphNodePosition(blueprintScope, phase.id, {
      revision: phase.revision,
      graphX,
      graphY,
    });
    updateGraphPhase(phase.id, response);
  }

  async function addGraphBlocker(phase: BlueprintPhase, blockerId: string) {
    const response = await blueprintService.addGraphNodeBlocker(
      blueprintScope,
      phase.id,
      blockerId,
      phase.revision,
    );
    updateGraphPhase(phase.id, response);
  }

  async function removeGraphBlocker(phase: BlueprintPhase, blockerId: string) {
    const response = await blueprintService.removeGraphNodeBlocker(
      blueprintScope,
      phase.id,
      blockerId,
      phase.revision,
    );
    updateGraphPhase(phase.id, response);
  }

  async function updateGraphPhaseMetadata(phase: BlueprintPhase, metadata: BlueprintPhaseMetadata) {
    await blueprintService.updatePhase(blueprintScope, phase.id, {
      revision: phase.revision,
      position: phase.position,
      ...metadata,
    });
    await loadPath();
  }

  /** Refreshes both views so graph-node revisions stay aligned with the detailed authoring DTO. */
  async function refreshSubGraph(phaseId: string | null | undefined) {
    if (!pathId || !phaseId) return;
    const [nextPath, graph] = await Promise.all([
      blueprintService.getPath(blueprintScope, pathId),
      blueprintService.getSubGraph(blueprintScope, phaseId),
    ]);
    // The nested DTO has no phase coordinates or prerequisites; keep the ones already loaded
    // rather than dropping them while the sub-graph editor is open.
    setPath((current) => {
      if (!current) return nextPath;
      const heldById = new Map(current.blueprintPhases.map((phase) => [phase.id, phase]));
      return withGraphNodes(
        nextPath,
        nextPath.blueprintPhases.map((phase): BlueprintGraphNode => {
          const held = heldById.get(phase.id);
          return {
            id: phase.id,
            // The revision the server just sent, not the one held here: `withGraphNodes` writes
            // this back onto the phase, so carrying the stale one over meant the next phase
            // mutation sent a revision the server had already moved past -- a 409 the page then
            // reported as a success.
            revision: phase.revision,
            title: phase.title,
            graphX: held?.graphX ?? null,
            graphY: held?.graphY ?? null,
            blockerIds: held?.blockerIds ?? [],
          };
        }),
      );
    });
    setSubGraphNodes(graph.nodes);
  }

  /** Keeps an open fixed-phase graph current after mutations from its detail panel. */
  async function refreshActiveEditorData() {
    if (editorMode === "graph" && subGraphPhaseId) {
      await refreshSubGraph(subGraphPhaseId);
      return;
    }
    await loadPath();
  }

  /** Adds a newly created canvas step to both its detailed phase and the thin graph state. */
  function appendCreatedSubGraphStep(
    step: BlueprintStep,
    graphPosition: { revision: number; graphX: number; graphY: number },
  ) {
    const positionedStep = { ...step, ...graphPosition };
    setSubGraphNodes((current) => [
      ...current,
      {
        id: step.id,
        revision: graphPosition.revision,
        title: step.title,
        type: "STEP",
        blueprintPhaseId: step.blueprintPhaseId,
        graphX: graphPosition.graphX,
        graphY: graphPosition.graphY,
        blockerIds: [],
      },
    ]);
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases.map((phase) =>
              phase.id === step.blueprintPhaseId
                ? {
                    ...phase,
                    blueprintSteps: [...phase.blueprintSteps, positionedStep],
                  }
                : phase,
            ),
          }
        : current,
    );
  }

  /** Adds a newly created canvas knowledge check to both its detailed phase and thin graph state. */
  function appendCreatedSubGraphQuestion(
    question: BlueprintQuestion,
    graphPosition: { revision: number; graphX: number; graphY: number },
  ) {
    const positionedQuestion = {
      ...question,
      revision: graphPosition.revision,
    };
    setSubGraphNodes((current) => [
      ...current,
      {
        id: question.id,
        revision: graphPosition.revision,
        title: question.title,
        type: "QUESTION",
        blueprintPhaseId: question.blueprintPhaseId,
        graphX: graphPosition.graphX,
        graphY: graphPosition.graphY,
        blockerIds: [],
      },
    ]);
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases.map((phase) =>
              phase.id === question.blueprintPhaseId
                ? {
                    ...phase,
                    blueprintCheckQuestions: [...phase.blueprintCheckQuestions, positionedQuestion],
                  }
                : phase,
            ),
          }
        : current,
    );
  }

  async function saveSubGraphPosition(node: BlueprintGraphNode, graphX: number, graphY: number) {
    setSubGraphNodes((current) =>
      current.map((item) => (item.id === node.id ? { ...item, graphX, graphY } : item)),
    );
    let response: { revision: number; graphX: number; graphY: number };
    try {
      response = await blueprintService.updateSubGraphNodePosition(blueprintScope, node.id, {
        revision: node.revision,
        graphX,
        graphY,
      });
    } catch (reason) {
      setSubGraphNodes((current) =>
        current.map((item) =>
          item.id === node.id ? { ...item, graphX: node.graphX, graphY: node.graphY } : item,
        ),
      );
      throw reason;
    }
    const phaseId = node.blueprintPhaseId ?? subGraphPhaseId;
    setSubGraphNodes((current) =>
      current.map((item) => (item.id === node.id ? { ...item, ...response } : item)),
    );
    if (!phaseId) return;
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases.map((phase) => {
              if (phase.id !== phaseId) return phase;
              return {
                ...phase,
                blueprintSteps: phase.blueprintSteps.map((step) =>
                  step.id === node.id ? { ...step, ...response } : step,
                ),
                blueprintCheckQuestions: phase.blueprintCheckQuestions.map((question) =>
                  question.id === node.id ? { ...question, revision: response.revision } : question,
                ),
              };
            }),
          }
        : current,
    );
  }

  /** Applies an edge mutation without reloading the whole fixed-phase graph. */
  function updateSubGraphBlockers(
    node: BlueprintGraphNode,
    update: { revision: number; blockerIds: string[] },
  ) {
    const phaseId = node.blueprintPhaseId ?? subGraphPhaseId;
    setSubGraphNodes((current) =>
      current.map((item) => (item.id === node.id ? { ...item, ...update } : item)),
    );
    if (!phaseId) return;
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases.map((phase) => {
              if (phase.id !== phaseId) return phase;
              return {
                ...phase,
                blueprintSteps: phase.blueprintSteps.map((step) =>
                  step.id === node.id ? { ...step, ...update } : step,
                ),
                blueprintCheckQuestions: phase.blueprintCheckQuestions.map((question) =>
                  question.id === node.id ? { ...question, revision: update.revision } : question,
                ),
              };
            }),
          }
        : current,
    );
  }

  async function addSubGraphBlocker(node: BlueprintGraphNode, blockerId: string) {
    const response = await blueprintService.addSubGraphNodeBlocker(
      blueprintScope,
      node.id,
      blockerId,
      node.revision,
    );
    updateSubGraphBlockers(node, response);
  }

  async function removeSubGraphBlocker(node: BlueprintGraphNode, blockerId: string) {
    const response = await blueprintService.removeSubGraphNodeBlocker(
      blueprintScope,
      node.id,
      blockerId,
      node.revision,
    );
    updateSubGraphBlockers(node, response);
  }

  async function updateSubGraphQuestion(
    question: BlueprintQuestion,
    metadata: BlueprintQuestionMetadata,
  ) {
    await blueprintService.updateQuestion(blueprintScope, question.id, {
      revision: question.revision,
      position: question.position,
      ...metadata,
    });
    await refreshSubGraph(question.blueprintPhaseId);
  }

  async function addSubGraphQuestionOption(
    question: BlueprintQuestion,
    label: string,
    correct: boolean,
  ) {
    await blueprintService.createOption(blueprintScope, question.id, {
      position: question.blueprintCheckOptions.length,
      label,
      correct,
    });
    await refreshSubGraph(question.blueprintPhaseId);
  }

  /**
   * Asks first, like the identical control in the outline. The dialog then owns the request, its
   * failure and the refresh, through `deleteItem`.
   */
  function removeSubGraphQuestionOption(option: BlueprintOption) {
    requestDelete("option", option.id, option.label);
    return Promise.resolve();
  }

  async function updateSubGraphStep(step: BlueprintStep, metadata: BlueprintStepMetadata) {
    await blueprintService.updateStep(blueprintScope, step.id, {
      revision: step.revision,
      position: step.position,
      ...metadata,
    });
    await refreshSubGraph(step.blueprintPhaseId);
  }

  async function openSubGraph(phase: BlueprintPhase) {
    if (phase.type === "AI_ENHANCED") return;
    setError(null);
    try {
      const graph = await blueprintService.getSubGraph(blueprintScope, phase.id);
      setSubGraphNodes(graph.nodes);
      setSubGraphPhaseId(phase.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Phase graph could not be loaded.");
    }
  }

  /** Reloads top-level graph positions, which are not refreshed by subgraph mutations. */
  async function returnToTopLevelGraph() {
    if (!path) return;
    setError(null);
    setSubGraphPhaseId(null);
    setSubGraphNodes([]);
    try {
      const graph = await blueprintService.getGraph(blueprintScope, path.id);
      const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
      setPath((current) =>
        current
          ? {
              ...current,
              blueprintPhases: current.blueprintPhases.map((phase) => {
                const node = nodesById.get(phase.id);
                return node
                  ? {
                      ...phase,
                      revision: node.revision,
                      graphX: node.graphX,
                      graphY: node.graphY,
                      blockerIds: node.blockerIds,
                    }
                  : phase;
              }),
            }
          : current,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Blueprint graph could not be loaded.");
    }
  }

  /** Switching views, from the bar or from a two-finger swipe — the two must not disagree. */
  function changeEditorMode(mode: EditorMode) {
    if (mode === editorMode) return;
    if (mode === "graph") {
      void openGraphEditor();
      return;
    }
    setEditorMode("list");
    // The graph endpoints update node revisions independently from the nested path DTO. Reload it
    // before exposing list mutations so their optimistic-lock revisions are current.
    void loadPath();
  }

  async function openGraphEditor() {
    if (!path) return;
    setError(null);
    try {
      const activeSubGraphPhase = subGraphPhaseId
        ? path.blueprintPhases.find((phase) => phase.id === subGraphPhaseId)
        : null;
      if (activeSubGraphPhase?.type === "FIXED") {
        const graph = await blueprintService.getSubGraph(blueprintScope, activeSubGraphPhase.id);
        setSubGraphNodes(graph.nodes);
        setEditorMode("graph");
        return;
      }
      const graph = await blueprintService.getGraph(blueprintScope, path.id);
      const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
      setPath((current) =>
        current
          ? {
              ...current,
              blueprintPhases: current.blueprintPhases.map((phase) => {
                const node = nodesById.get(phase.id);
                return node
                  ? {
                      ...phase,
                      revision: node.revision,
                      graphX: node.graphX,
                      graphY: node.graphY,
                      blockerIds: node.blockerIds,
                    }
                  : phase;
              }),
            }
          : current,
      );
      if (subGraphPhaseId) {
        setSubGraphPhaseId(null);
        setSubGraphNodes([]);
      }
      setEditorMode("graph");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Blueprint graph could not be loaded.");
    }
  }

  /**
   * Puts the author back in front of what they were looking at before they were sent here.
   *
   * **Not until the path on screen is the one the address names.** Navigating to the draft changes
   * the URL immediately; the draft itself arrives a request later, and until it does `path` is
   * still the *published* version this request came from. Its phases carry the same titles — a
   * draft is a copy — so a title match against it succeeds and reopens a phase whose id exists only
   * in the version that was just left, and the page it opened would vanish the moment the draft
   * lands.
   *
   * The state is cleared as soon as it is acted on: a reload or a step back through history must
   * not open the same thing again, and a title that matches nothing is not a reason to
   * keep asking.
   */
  const reopenRequest = (location.state as { reopen?: BlueprintReopen } | null)?.reopen ?? null;
  useEffect(() => {
    if (!reopenRequest || !path || path.id !== pathId) return;
    const phase = path.blueprintPhases.find(
      (candidate) => candidate.title === reopenRequest.phaseTitle,
    );
    void navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    if (!phase) return;
    // Deferred to a microtask: React 19's lint rejects a synchronous setState in an effect body,
    // and this is the pattern the repo already passes with.
    queueMicrotask(() => {
      if (reopenRequest.nodeTitle && phase.type === "FIXED") {
        setPendingOpenNodeTitle(reopenRequest.nodeTitle);
        setEditorMode("graph");
        void openSubGraph(phase);
        return;
      }
      setPendingOpenPhaseTitle(phase.title);
      void openGraphEditor();
    });
    // `openSubGraph` and `openGraphEditor` are declared per render and would restart this on every
    // one; what this effect actually depends on is the request and the path it has to find it in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, navigate, path, pathId, reopenRequest]);

  /**
   * Applies the graph-side effects reported by a phase deletion. The response also contains the
   * deleted phase itself; filtering it out first intentionally makes that entry a no-op.
   */
  function applyPhaseDeletion(phaseId: string, updatedPhases: { id: string; revision: number }[]) {
    const revisionsById = new Map(updatedPhases.map((phase) => [phase.id, phase.revision]));
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases
              .filter((phase) => phase.id !== phaseId)
              .map((phase) => {
                const revision = revisionsById.get(phase.id);
                return revision === undefined
                  ? phase
                  : {
                      ...phase,
                      revision,
                      blockerIds: phase.blockerIds.filter((blockerId) => blockerId !== phaseId),
                    };
              }),
          }
        : current,
    );
  }

  /**
   * Applies the graph-side effects reported by a step deletion. The deleted step may appear in
   * updatedSteps, but it is removed before revisions are applied.
   */
  function applyStepDeletion(stepId: string, updatedSteps: { id: string; revision: number }[]) {
    const revisionsById = new Map(updatedSteps.map((step) => [step.id, step.revision]));
    setSubGraphNodes((current) =>
      current
        .filter((node) => node.id !== stepId)
        .map((node) => {
          const revision = revisionsById.get(node.id);
          return revision === undefined
            ? node
            : {
                ...node,
                revision,
                blockerIds: node.blockerIds.filter((blockerId) => blockerId !== stepId),
              };
        }),
    );
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases.map((phase) => ({
              ...phase,
              blueprintSteps: phase.blueprintSteps
                .filter((step) => step.id !== stepId)
                .map((step) => {
                  const revision = revisionsById.get(step.id);
                  return revision === undefined
                    ? step
                    : {
                        ...step,
                        revision,
                        blockerIds: step.blockerIds.filter((blockerId) => blockerId !== stepId),
                      };
                }),
              blueprintCheckQuestions: phase.blueprintCheckQuestions.map((question) => {
                const revision = revisionsById.get(question.id);
                return revision === undefined ? question : { ...question, revision };
              }),
            })),
          }
        : current,
    );
  }

  /**
   * Applies the graph-side effects reported by a question deletion. The deleted question may
   * appear in updatedQuestions, but it is removed before revisions are applied.
   */
  function applyQuestionDeletion(
    questionId: string,
    updatedQuestions: { id: string; revision: number }[],
  ) {
    const revisionsById = new Map(
      updatedQuestions.map((question) => [question.id, question.revision]),
    );
    setSubGraphNodes((current) =>
      current
        .filter((node) => node.id !== questionId)
        .map((node) => {
          const revision = revisionsById.get(node.id);
          return revision === undefined
            ? node
            : {
                ...node,
                revision,
                blockerIds: node.blockerIds.filter((blockerId) => blockerId !== questionId),
              };
        }),
    );
    setPath((current) =>
      current
        ? {
            ...current,
            blueprintPhases: current.blueprintPhases.map((phase) => ({
              ...phase,
              blueprintSteps: phase.blueprintSteps.map((step) => {
                const revision = revisionsById.get(step.id);
                return revision === undefined
                  ? step
                  : {
                      ...step,
                      revision,
                      blockerIds: step.blockerIds.filter((blockerId) => blockerId !== questionId),
                    };
              }),
              blueprintCheckQuestions: phase.blueprintCheckQuestions
                .filter((question) => question.id !== questionId)
                .map((question) => {
                  const revision = revisionsById.get(question.id);
                  return revision === undefined ? question : { ...question, revision };
                }),
            })),
          }
        : current,
    );
  }

  /**
   * Asks before deleting, for everything the list editor can delete.
   *
   * The graph editor already asked; the list editor did not, so the same phase was one guarded
   * click away on one surface and one unguarded click away on the other. Nothing here is
   * recoverable from the UI — there is no undo endpoint — so the question is the only safety net
   * there is.
   */
  function requestDelete(kind: CreateKind, id: string, label: string) {
    whenEditable(() => setPendingDelete({ kind, id, label }));
  }

  async function deleteItem(
    kind: "phase" | "step" | "question" | "task" | "resource" | "option",
    id: string,
  ) {
    setDeletingId(id);
    setError(null);
    try {
      const phase = path?.blueprintPhases.find((item) => item.id === id);
      const step = path?.blueprintPhases
        .flatMap((item) => item.blueprintSteps)
        .find((item) => item.id === id);
      const question = path?.blueprintPhases
        .flatMap((item) => item.blueprintCheckQuestions)
        .find((item) => item.id === id);
      const task = path?.blueprintPhases
        .flatMap((item) => item.blueprintSteps)
        .flatMap((item) => item.blueprintTasks)
        .find((item) => item.id === id);
      const resource = path?.blueprintPhases
        .flatMap((item) => item.blueprintSteps)
        .flatMap((item) => item.blueprintResources)
        .find((item) => item.id === id);
      const option = path?.blueprintPhases
        .flatMap((item) => item.blueprintCheckQuestions)
        .flatMap((item) => item.blueprintCheckOptions)
        .find((item) => item.id === id);
      if (kind === "phase" && phase) {
        const response = await blueprintService.deletePhase(blueprintScope, id, phase.revision);
        applyPhaseDeletion(id, response.updatedPhases);
      } else if (kind === "step" && step) {
        const response = await blueprintService.deleteStep(blueprintScope, id, step.revision);
        applyStepDeletion(id, response.updatedSteps);
      } else if (kind === "question" && question) {
        const response = await blueprintService.deleteQuestion(
          blueprintScope,
          id,
          question.revision,
        );
        applyQuestionDeletion(id, response.updatedQuestions);
      } else if (kind === "task" && task)
        await blueprintService.deleteTask(blueprintScope, id, task.revision);
      else if (kind === "resource" && resource)
        await blueprintService.deleteResource(blueprintScope, id, resource.revision);
      else if (kind === "option" && option)
        await blueprintService.deleteOption(blueprintScope, id, option.revision);
      else throw new Error(`The ${kind} could not be found.`);
      if (kind !== "phase" && kind !== "step" && kind !== "question")
        await refreshActiveEditorData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `The ${kind} could not be deleted.`);
      // Rethrown, not swallowed: the graph panels close themselves and toast "deleted" on a
      // resolved promise, so a 409 on a stale revision used to read as a success with the node
      // still on the canvas. Every caller below handles the rejection.
      throw reason;
    } finally {
      setDeletingId(null);
    }
  }

  async function reorder(kind: SortKind, id: string, position: number) {
    if (!path) return;
    const phases = path.blueprintPhases;
    const phase = phases.find((item) => item.id === id);
    const step = phases.flatMap((item) => item.blueprintSteps).find((item) => item.id === id);
    const task = phases
      .flatMap((item) => item.blueprintSteps)
      .flatMap((item) => item.blueprintTasks)
      .find((item) => item.id === id);
    const question = phases
      .flatMap((item) => item.blueprintCheckQuestions)
      .find((item) => item.id === id);
    const option = phases
      .flatMap((item) => item.blueprintCheckQuestions)
      .flatMap((item) => item.blueprintCheckOptions)
      .find((item) => item.id === id);
    setPath((current) => {
      if (!current) return current;
      const move = <T extends { id: string; position: number }>(items: T[]) => {
        const sourceIndex = items.findIndex((item) => item.id === id);
        if (sourceIndex < 0) return items;
        const reordered = [...items];
        const [moved] = reordered.splice(sourceIndex, 1);
        reordered.splice(position, 0, moved);
        return reordered.map((item, index) => ({ ...item, position: index }));
      };
      if (kind === "phase") return { ...current, blueprintPhases: move(current.blueprintPhases) };
      return {
        ...current,
        blueprintPhases: current.blueprintPhases.map((currentPhase) => ({
          ...currentPhase,
          blueprintSteps:
            kind === "step" && currentPhase.blueprintSteps.some((item) => item.id === id)
              ? move(currentPhase.blueprintSteps)
              : currentPhase.blueprintSteps.map((currentStep) => ({
                  ...currentStep,
                  blueprintTasks:
                    kind === "task" && currentStep.blueprintTasks.some((item) => item.id === id)
                      ? move(currentStep.blueprintTasks)
                      : currentStep.blueprintTasks,
                })),
          blueprintCheckQuestions:
            kind === "question" &&
            currentPhase.blueprintCheckQuestions.some((item) => item.id === id)
              ? move(currentPhase.blueprintCheckQuestions)
              : currentPhase.blueprintCheckQuestions.map((currentQuestion) => ({
                  ...currentQuestion,
                  blueprintCheckOptions:
                    kind === "option" &&
                    currentQuestion.blueprintCheckOptions.some((item) => item.id === id)
                      ? move(currentQuestion.blueprintCheckOptions)
                      : currentQuestion.blueprintCheckOptions,
                })),
        })),
      };
    });
    try {
      let updates: { id: string; revision: number; position: number }[] = [];
      if (kind === "phase" && phase)
        updates = await blueprintService.updatePhasePosition(blueprintScope, id, {
          revision: phase.revision,
          position,
        });
      if (kind === "step" && step)
        updates = await blueprintService.updateStepPosition(blueprintScope, id, {
          revision: step.revision,
          position,
        });
      if (kind === "task" && task)
        updates = await blueprintService.updateTaskPosition(blueprintScope, id, {
          revision: task.revision,
          position,
        });
      if (kind === "question" && question)
        updates = await blueprintService.updateQuestionPosition(blueprintScope, id, {
          revision: question.revision,
          position,
        });
      if (kind === "option" && option)
        updates = await blueprintService.updateOptionPosition(blueprintScope, id, {
          revision: option.revision,
          position,
        });
      setPath((current) => {
        if (!current) return current;
        const applyUpdates = <T extends { id: string; revision: number; position: number }>(
          items: T[],
        ) => {
          const byId = new Map(updates.map((update) => [update.id, update]));
          return items.map((item) => {
            const update = byId.get(item.id);
            return update
              ? {
                  ...item,
                  revision: update.revision,
                  position: update.position,
                }
              : item;
          });
        };
        if (kind === "phase")
          return {
            ...current,
            blueprintPhases: applyUpdates(current.blueprintPhases),
          };
        return {
          ...current,
          blueprintPhases: current.blueprintPhases.map((currentPhase) => ({
            ...currentPhase,
            blueprintSteps:
              kind === "step" && currentPhase.blueprintSteps.some((item) => item.id === id)
                ? applyUpdates(currentPhase.blueprintSteps)
                : currentPhase.blueprintSteps.map((currentStep) => ({
                    ...currentStep,
                    blueprintTasks:
                      kind === "task" && currentStep.blueprintTasks.some((item) => item.id === id)
                        ? applyUpdates(currentStep.blueprintTasks)
                        : currentStep.blueprintTasks,
                  })),
            blueprintCheckQuestions:
              kind === "question" &&
              currentPhase.blueprintCheckQuestions.some((item) => item.id === id)
                ? applyUpdates(currentPhase.blueprintCheckQuestions)
                : currentPhase.blueprintCheckQuestions.map((currentQuestion) => ({
                    ...currentQuestion,
                    blueprintCheckOptions:
                      kind === "option" &&
                      currentQuestion.blueprintCheckOptions.some((item) => item.id === id)
                        ? applyUpdates(currentQuestion.blueprintCheckOptions)
                        : currentQuestion.blueprintCheckOptions,
                  })),
          })),
        };
      });
    } catch (reason) {
      // Back to what the server has, not to the snapshot this call started from: anything saved
      // meanwhile would be thrown away with the failed move.
      void loadPath(false);
      setError(reason instanceof Error ? reason.message : "The item could not be reordered.");
    }
  }

  /** The ids of the list an item sits in -- a drag only reorders within one. */
  function siblingIds(kind: SortKind, id: string): string[] {
    const phases = path?.blueprintPhases ?? [];
    const steps = phases.flatMap((phase) => phase.blueprintSteps);
    const questions = phases.flatMap((phase) => phase.blueprintCheckQuestions);
    const lists: { id: string }[][] =
      kind === "phase"
        ? [phases]
        : kind === "step"
          ? phases.map((phase) => phase.blueprintSteps)
          : kind === "task"
            ? steps.map((step) => step.blueprintTasks)
            : kind === "question"
              ? phases.map((phase) => phase.blueprintCheckQuestions)
              : questions.map((question) => question.blueprintCheckOptions);
    return (lists.find((list) => list.some((item) => item.id === id)) ?? []).map((item) => item.id);
  }

  function dragProps(kind: SortKind, id: string, position: number) {
    return {
      draggable: true,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = "move";
        setDragged({ kind, id });
      },
      onDragOver: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const source = dragged;
        setDragged(null);
        // Dropped on an item of another list, the target's position means nothing in the source's.
        if (source?.kind !== kind || source.id === id) return;
        if (!siblingIds(kind, id).includes(source.id)) return;
        whenEditable(() => void reorder(kind, source.id, position));
      },
      onDragEnd: () => setDragged(null),
    };
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
      setPendingOpenPhaseTitle(phaseTitle);
      changeEditorMode("graph");
    },
    addBlocker: addGraphBlocker,
    removeBlocker: removeGraphBlocker,
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
  const subGraphPhase = subGraphPhaseId
    ? (path.blueprintPhases.find((phase) => phase.id === subGraphPhaseId) ?? null)
    : null;

  return (
    <div className="min-h-screen">
      <DeleteItemDialog
        pendingDelete={pendingDelete}
        deletingId={deletingId}
        error={pendingDeleteError}
        onCancel={() => {
          setPendingDelete(null);
          setPendingDeleteError(null);
        }}
        onConfirm={() => {
          if (!pendingDelete) return;
          const { kind, id } = pendingDelete;
          setPendingDeleteError(null);
          void deleteItem(kind, id).then(
            () => setPendingDelete(null),
            (reason: unknown) =>
              setPendingDeleteError(
                reason instanceof Error ? reason.message : `The ${kind} could not be deleted.`,
              ),
          );
        }}
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
          value={editorMode}
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
          onChange={changeEditorMode}
          layoutId="blueprint-editor-mode-pill"
          ariaLabel="Blueprint view"
        />
        {editorMode === "graph" ? (
          subGraphPhase ? (
            <BlueprintSubGraphEditor
              phase={subGraphPhase}
              nodes={subGraphNodes}
              editable={path.status === "DRAFT"}
              onRequestDraft={(node) =>
                void openDraftAndContinue({
                  phaseTitle: subGraphPhase.title,
                  nodeTitle: node.title,
                })
              }
              openNodeTitle={pendingOpenNodeTitle}
              onOpenedNode={() => setPendingOpenNodeTitle(null)}
              onBack={() => void returnToTopLevelGraph()}
              onPositionChange={saveSubGraphPosition}
              onAddBlocker={addSubGraphBlocker}
              onRemoveBlocker={removeSubGraphBlocker}
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
              onUpdateQuestion={updateSubGraphQuestion}
              onAddOption={addSubGraphQuestionOption}
              onRemoveOption={removeSubGraphQuestionOption}
              onUpdateStep={updateSubGraphStep}
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
              openPhaseTitle={pendingOpenPhaseTitle}
              onOpenedPhase={() => setPendingOpenPhaseTitle(null)}
              onPositionChange={saveGraphPosition}
              onAddBlocker={addGraphBlocker}
              onRemoveBlocker={removeGraphBlocker}
              onCreateNode={(graphX: number, graphY: number) => {
                openCreate("phase", path.id, path.blueprintPhases.length, {
                  graphX,
                  graphY,
                });
                return Promise.resolve();
              }}
              onDeletePhase={(phase) => deleteItem("phase", phase.id)}
              onOpenSubGraph={(phase) => void openSubGraph(phase)}
              onUpdatePhase={updateGraphPhaseMetadata}
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
