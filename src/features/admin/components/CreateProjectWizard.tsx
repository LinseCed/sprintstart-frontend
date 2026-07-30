import { useCallback, useEffect, useId, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { Modal } from "../../../components/ui/Modal";
import {
  projectService,
  type AdminProjectDetails,
  type ProjectManager,
} from "../../../services/projectService";
import {
  addDraftSource,
  connectDraftSources,
  countUnconnectedSources,
  hasFailedSources,
  removeDraftSource,
  type DraftSource,
} from "../projectSourcesDraft";
import { ProjectSourcesStep } from "./ProjectSourcesStep";

type CreateProjectWizardProps = {
  isOpen: boolean;
  tokenNames: string[];
  onClose: () => void;
  /** Fired once the project exists, before any source finished connecting. */
  onProjectCreated: (project: AdminProjectDetails) => void;
};

type WizardStep = "details" | "sources";

const stepDescriptions: Record<WizardStep, string> = {
  details: "Step 1 of 2 — name the project and pick who manages it.",
  sources: "Step 2 of 2 — connect GitHub repositories, or skip for now.",
};

/**
 * Two-step flow for creating a project and optionally attaching sources to it.
 *
 * The project is created when the wizard finishes, not when step 1 is left, so
 * cancelling out of step 2 leaves nothing behind. Sources are connected one by
 * one afterwards against the new project id; because creation and connecting
 * are separate backend calls, a source failure cannot roll the project back —
 * the wizard therefore stays open on a partial failure and offers a retry
 * rather than pretending the whole operation failed.
 */
export function CreateProjectWizard({
  isOpen,
  tokenNames,
  onClose,
  onProjectCreated,
}: CreateProjectWizardProps) {
  const nameInputId = useId();
  const descriptionInputId = useId();
  const managerSelectId = useId();

  const [step, setStep] = useState<WizardStep>("details");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [managerId, setManagerId] = useState("");

  const [managerCandidates, setManagerCandidates] = useState<ProjectManager[]>(
    [],
  );
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidatesError, setCandidatesError] = useState("");

  const [sources, setSources] = useState<DraftSource[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Set once the project exists, so a retry after a partial failure connects
  // the remaining sources instead of creating a second project.
  const [createdProjectId, setCreatedProjectId] = useState("");

  const loadManagerCandidates = useCallback(async () => {
    setIsLoadingCandidates(true);
    setCandidatesError("");

    try {
      setManagerCandidates(await projectService.getManagerCandidates());
    } catch (error) {
      setCandidatesError(
        error instanceof Error
          ? error.message
          : "Manager candidates could not be loaded.",
      );
    } finally {
      setIsLoadingCandidates(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Deferred so the fetch is not a synchronous state update inside the
    // effect body, which `react-hooks/set-state-in-effect` rejects.
    void Promise.resolve().then(loadManagerCandidates);
  }, [isOpen, loadManagerCandidates]);

  const resetWizard = () => {
    setStep("details");
    setName("");
    setDescription("");
    setManagerId("");
    setSources([]);
    setSubmitError("");
    setCreatedProjectId("");
  };

  const closeWizard = () => {
    if (isSubmitting) return;

    resetWizard();
    onClose();
  };

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length > 0;
  const pendingSourceCount = countUnconnectedSources(sources);
  const hasFailures = hasFailedSources(sources);

  const goToSources = () => {
    if (!isNameValid) return;

    setSubmitError("");
    setStep("sources");
  };

  /** Creates the project unless a previous attempt already did. */
  const ensureProject = async (): Promise<string> => {
    if (createdProjectId) return createdProjectId;

    const project = await projectService.createProject({
      name: trimmedName,
      description: description.trim() || undefined,
    });

    if (managerId) {
      await projectService.setProjectManager(project.id, managerId);
    }

    setCreatedProjectId(project.id);
    onProjectCreated(project);

    return project.id;
  };

  const finish = async () => {
    if (!isNameValid) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const projectId = await ensureProject();

      if (sources.length === 0) {
        resetWizard();
        onClose();
        return;
      }

      const connectedSources = await connectDraftSources(
        projectId,
        sources,
        setSources,
      );

      if (hasFailedSources(connectedSources)) {
        // The project is already saved; keep the wizard open so the failed
        // repositories can be retried or dropped without losing the list.
        setSubmitError(
          "The project was created, but some repositories could not be connected.",
        );
        return;
      }

      resetWizard();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Project could not be created.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const retrySource = async (sourceId: string) => {
    const source = sources.find((current) => current.id === sourceId);
    if (!source || !createdProjectId) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const retriedSources = await connectDraftSources(
        createdProjectId,
        [source],
        (progressSources) =>
          setSources((current) =>
            current.map(
              (currentSource) =>
                progressSources.find(
                  (progressSource) => progressSource.id === currentSource.id,
                ) ?? currentSource,
            ),
          ),
      );

      if (hasFailedSources(retriedSources)) {
        setSubmitError("The repository could not be connected.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDetailsStep = step === "details";
  // Once the project exists there is nothing left to cancel and going back
  // would misrepresent the details as still editable, so the secondary button
  // turns into a plain way out.
  const isProjectCreated = Boolean(createdProjectId);

  return (
    <Modal
      isOpen={isOpen}
      title="New Project"
      description={stepDescriptions[step]}
      size="xl"
      isDismissDisabled={isSubmitting}
      onClose={closeWizard}
      closeLabel="Close new project wizard"
      footer={
        <>
          <button
            type="button"
            onClick={
              isDetailsStep || isProjectCreated
                ? closeWizard
                : () => setStep("details")
            }
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-app-border bg-app-surface px-5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDetailsStep ? (
              "Cancel"
            ) : isProjectCreated ? (
              "Done"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Back
              </>
            )}
          </button>

          {isDetailsStep ? (
            <button
              type="button"
              onClick={goToSources}
              disabled={!isNameValid}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-app-brand bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:border-app-brand-hover hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : !isProjectCreated || hasFailures ? (
            <button
              type="button"
              onClick={() => void finish()}
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-app-brand bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:border-app-brand-hover hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isProjectCreated
                ? "Retry failed sources"
                : sources.length === 0
                  ? "Create without sources"
                  : `Create and connect ${pendingSourceCount} ${
                      pendingSourceCount === 1 ? "repository" : "repositories"
                    }`}
            </button>
          ) : null}
        </>
      }
    >
      {submitError && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-app-danger-border bg-app-danger-bg px-4 py-3 text-sm text-app-danger-text">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {isDetailsStep ? (
        <form
          id="create-project-details-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            goToSources();
          }}
        >
          <div>
            <label
              htmlFor={nameInputId}
              className="mb-1.5 block text-sm text-app-text-muted"
            >
              Name
            </label>
            <input
              id={nameInputId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-sm font-medium text-app-text outline-none transition-colors placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
            />
          </div>

          <div>
            <label
              htmlFor={descriptionInputId}
              className="mb-1.5 block text-sm text-app-text-muted"
            >
              Description
            </label>
            <textarea
              id={descriptionInputId}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="min-h-28 w-full resize-y rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm font-medium leading-relaxed text-app-text outline-none transition-colors placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow"
            />
          </div>

          <div>
            <label
              htmlFor={managerSelectId}
              className="mb-1.5 block text-sm text-app-text-muted"
            >
              Project manager
            </label>
            <select
              id={managerSelectId}
              value={managerId}
              onChange={(event) => setManagerId(event.target.value)}
              disabled={isLoadingCandidates || managerCandidates.length === 0}
              className="h-11 w-full rounded-xl border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition-colors focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {isLoadingCandidates
                  ? "Loading candidates..."
                  : managerCandidates.length === 0
                    ? "No candidates available"
                    : "No manager"}
              </option>
              {managerCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.firstName || candidate.lastName
                    ? `${candidate.firstName} ${candidate.lastName}`.trim()
                    : candidate.username}
                </option>
              ))}
            </select>

            {candidatesError && (
              <p className="mt-2 flex items-start gap-2 text-sm text-app-danger-text">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{candidatesError}</span>
              </p>
            )}
          </div>
        </form>
      ) : (
        <ProjectSourcesStep
          sources={sources}
          tokenNames={tokenNames}
          disabled={isSubmitting}
          onAdd={(source) =>
            setSources((current) => addDraftSource(current, source))
          }
          onRemove={(sourceId) =>
            setSources((current) => removeDraftSource(current, sourceId))
          }
          onRetry={
            createdProjectId
              ? (sourceId) => void retrySource(sourceId)
              : undefined
          }
        />
      )}
    </Modal>
  );
}
