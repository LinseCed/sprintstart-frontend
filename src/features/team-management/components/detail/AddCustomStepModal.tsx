import { Plus, X } from 'lucide-react';
import { Modal } from '../../../../components/ui/Modal';

export type CustomStepTaskDraft = {
    title: string;
    description: string;
};

type AddCustomStepModalProps = {
    open: boolean;
    title: string;
    description: string;
    expectedOutcome: string;
    estimatedMinutes: string;
    tasks: CustomStepTaskDraft[];
    addingStep: boolean;
    errorMessage: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onExpectedOutcomeChange: (value: string) => void;
    onEstimatedMinutesChange: (value: string) => void;
    onTasksChange: (updater: (current: CustomStepTaskDraft[]) => CustomStepTaskDraft[]) => void;
    onClose: () => void;
    onSubmit: () => void;
};

export function AddCustomStepModal({
    open,
    title,
    description,
    expectedOutcome,
    estimatedMinutes,
    tasks,
    addingStep,
    errorMessage,
    onTitleChange,
    onDescriptionChange,
    onExpectedOutcomeChange,
    onEstimatedMinutesChange,
    onTasksChange,
    onClose,
    onSubmit,
}: AddCustomStepModalProps) {
    return (
        <Modal
            isOpen={open}
            title="Add Custom Step"
            description="Add the project-specific step for the selected slot."
            size="lg"
            zIndexClassName="z-[60]"
            bodyClassName="max-h-[min(68vh,720px)] overflow-y-auto px-7 py-6"
            closeLabel="Close add step modal"
            isDismissDisabled={addingStep}
            onClose={onClose}
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={addingStep}
                        className="rounded-xl border border-app-border bg-app-surface px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={addingStep || title.trim().length === 0}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        {addingStep ? 'Adding...' : 'Add step'}
                    </button>
                </>
            }
        >
            <div className="space-y-3">
                <input
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="Meet your colleagues"
                    className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                />

                <textarea
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    placeholder="Describe what the member should do."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                />

                <textarea
                    value={expectedOutcome}
                    onChange={(event) => onExpectedOutcomeChange(event.target.value)}
                    placeholder="Describe the expected outcome."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                />

                <label className="block">
                    <span className="text-xs font-medium text-app-text-muted">
                        Estimated minutes
                    </span>
                    <input
                        type="number"
                        min="1"
                        value={estimatedMinutes}
                        onChange={(event) => onEstimatedMinutesChange(event.target.value)}
                        className="mt-1 w-32 rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                    />
                </label>

                <div className="rounded-2xl border border-app-border bg-app-surface-muted p-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-app-text">Tasks</p>
                        <button
                            type="button"
                            onClick={() =>
                                onTasksChange((current) => [
                                    ...current,
                                    { title: '', description: '' },
                                ])
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-app-brand hover:bg-app-brand-soft"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add task
                        </button>
                    </div>

                    <div className="mt-3 space-y-2">
                        {tasks.map((task, index) => (
                            <div
                                key={index}
                                className="grid gap-2 rounded-xl border border-app-border bg-app-bg p-2"
                            >
                                <div className="flex gap-2">
                                    <input
                                        value={task.title}
                                        onChange={(event) =>
                                            onTasksChange((current) =>
                                                current.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              title: event.target.value,
                                                          }
                                                        : item,
                                                ),
                                            )
                                        }
                                        placeholder="Task title"
                                        className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                    />
                                    {tasks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onTasksChange((current) =>
                                                    current.filter(
                                                        (_, itemIndex) => itemIndex !== index,
                                                    ),
                                                )
                                            }
                                            className="rounded-lg p-2 text-app-text-muted hover:bg-app-danger-bg hover:text-app-danger-text"
                                            aria-label="Remove task row"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <input
                                    value={task.description}
                                    onChange={(event) =>
                                        onTasksChange((current) =>
                                            current.map((item, itemIndex) =>
                                                itemIndex === index
                                                    ? {
                                                          ...item,
                                                          description: event.target.value,
                                                      }
                                                    : item,
                                            ),
                                        )
                                    }
                                    placeholder="Optional task description"
                                    className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {errorMessage && (
                    <p className="text-xs text-app-danger-text">
                        {errorMessage}
                    </p>
                )}
            </div>
        </Modal>
    );
}
