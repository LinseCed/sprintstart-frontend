import { useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, CheckCircle2, ChevronDown, Clock, Lightbulb, Loader2, XCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { NodeStatusChip } from '../../skill-assessment/components/NodeStatusChip';
import { useLearnVerifyModule } from '../hooks/useLearnVerifyModule';
import { VerifyInput } from './VerifyInput';
import type { PathNode, PathView } from '../../skill-assessment/types';

type LearnVerifyModuleModalProps = {
    node: PathNode;
    path: PathView;
    /**
     * Called when the modal closes. `submittedAttempt` lets the parent decide
     * whether to refetch the path (an attempt may have changed the ledger);
     * `passed` lets it celebrate the unlock.
     */
    onClose: (result: { submittedAttempt: boolean; passed: boolean }) => void;
};

/**
 * A graph node opened as a learn-verify module: Frame (status/estimate/test-out),
 * Learn (grounded lesson + resources/tasks), Verify (the graded check, with a
 * fail-retry loop and escalating hints), and Payoff (the unlock moment).
 *
 * Already-mastered nodes show Frame + Learn only -- there's nothing to retry, so
 * no Verify form is rendered for them.
 */
export function LearnVerifyModuleModal({ node, path, onClose }: LearnVerifyModuleModalProps) {
    const {
        step,
        verification,
        isLoading,
        loadError,
        answer,
        setAnswer,
        latestAttempt,
        passed,
        submitting,
        submitError,
        gradingUnavailable,
        submit
    } = useLearnVerifyModule(node.stepId ?? null);

    const verifySectionRef = useRef<HTMLDivElement>(null);
    const alreadyMastered = node.state === 'MASTERED';
    const ready = !isLoading && !loadError && step !== null;

    const dependents = useMemo(
        () =>
            path.edges
                .filter(edge => edge.from === node.key)
                .map(edge => path.nodes.find(pathNode => pathNode.key === edge.to)?.label ?? edge.to),
        [path, node.key]
    );

    const close = () => onClose({ submittedAttempt: latestAttempt !== null, passed });

    const scrollToVerify = () => {
        verifySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const footer = !ready ? undefined : alreadyMastered || passed ? (
        <button
            onClick={close}
            className="rounded-xl bg-app-brand px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover"
        >
            {passed ? 'Done' : 'Close'}
        </button>
    ) : (
        <button
            onClick={() => void submit()}
            disabled={!answer.trim() || submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-app-brand px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit answer
        </button>
    );

    return (
        <Modal
            isOpen
            title={node.label}
            description={node.kind}
            size="lg"
            bodyClassName="max-h-[70vh] overflow-y-auto px-7 py-6"
            onClose={close}
            footer={footer}
        >
            {isLoading && (
                <div className="flex flex-col items-center gap-3 py-12 text-app-text-muted">
                    <Loader2 className="h-6 w-6 animate-spin text-app-brand" />
                    <p className="text-sm">Loading...</p>
                </div>
            )}

            {loadError && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-app-danger-solid" />
                    <p className="text-sm text-app-text-muted">{loadError}</p>
                </div>
            )}

            {!isLoading && !loadError && step && (
                <div className="space-y-8">
                    {/* Frame */}
                    <section>
                        <div className="flex flex-wrap items-center gap-3">
                            <NodeStatusChip state={node.state} />
                            {node.state === 'AVAILABLE' && (
                                <span className="text-xs text-app-text-muted">Prerequisites cleared</span>
                            )}
                            {step.estimatedMinutes > 0 && (
                                <span className="inline-flex items-center gap-1.5 text-xs text-app-text-muted">
                                    <Clock className="h-3.5 w-3.5" />
                                    ~{step.estimatedMinutes} min
                                </span>
                            )}
                        </div>
                        {!alreadyMastered && (
                            <button
                                type="button"
                                onClick={scrollToVerify}
                                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-app-brand-text hover:underline"
                            >
                                Skip to the check
                                <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </section>

                    {/* Learn */}
                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-app-text">Learn</h3>
                        {step.content ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.content}</ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-sm text-app-text-muted">No lesson content yet -- check back soon.</p>
                        )}

                        {step.resources.length > 0 && (
                            <ul className="mt-4 space-y-1.5">
                                {step.resources.map(resource => (
                                    <li key={resource.id} className="text-sm">
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-app-brand-text hover:underline"
                                        >
                                            {resource.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {step.tasks.length > 0 && (
                            <ul className="mt-4 space-y-1.5">
                                {step.tasks.map(task => (
                                    <li key={task.id} className="text-sm text-app-text">
                                        {task.title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Verify / Payoff */}
                    <section ref={verifySectionRef}>
                        <h3 className="mb-2 text-sm font-semibold text-app-text">Verify</h3>

                        {alreadyMastered ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-app-success-border bg-app-success-bg p-4">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-app-success-solid" />
                                <p className="text-sm text-app-success-text">You&apos;ve already mastered this.</p>
                            </div>
                        ) : passed ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-app-success-border bg-app-success-bg p-4">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-app-success-solid" />
                                <div>
                                    <p className="text-sm font-semibold text-app-success-text">Mastered!</p>
                                    {dependents.length > 0 && (
                                        <p className="mt-0.5 text-xs text-app-text-muted">
                                            Unlocked: {dependents.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {verification && (
                                    <>
                                        <p className="text-sm text-app-text">{verification.prompt}</p>
                                        <VerifyInput
                                            type={verification.type}
                                            answer={answer}
                                            onAnswerChange={setAnswer}
                                            disabled={submitting}
                                        />
                                    </>
                                )}

                                {latestAttempt && !latestAttempt.passed && (
                                    <div className="rounded-2xl border border-app-danger-border bg-app-surface-muted p-4">
                                        <div className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 shrink-0 text-app-danger-solid" />
                                            <p className="text-sm font-medium text-app-text">
                                                Not quite -- attempt {latestAttempt.attemptNo}
                                            </p>
                                        </div>
                                        {latestAttempt.feedback && (
                                            <p className="mt-2 text-xs text-app-text-muted">{latestAttempt.feedback}</p>
                                        )}
                                        {latestAttempt.hint && (
                                            <p className="mt-2 flex items-start gap-1.5 text-xs text-app-warning-text">
                                                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                                {latestAttempt.hint}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {gradingUnavailable && (
                                    <p className="flex items-center gap-2 text-sm text-app-danger-solid">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        Grading is temporarily unavailable. Please try again in a moment.
                                    </p>
                                )}
                                {submitError && (
                                    <p className="flex items-center gap-2 text-sm text-app-danger-solid">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {submitError}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </Modal>
    );
}
