import { useId, useState, type ReactNode } from 'react';
import { Check, Loader2, X } from 'lucide-react';

type ProposalRowProps = {
    title: ReactNode;
    subtitle?: ReactNode;
    meta?: ReactNode;
    canAct: boolean;
    onApprove: () => Promise<void>;
    onReject: (reason?: string) => Promise<void>;
};

/**
 * A single pending proposal with Approve/Reject actions. Approve is a single click (matches the
 * backend's no-body approve endpoint); Reject opens an inline confirm panel with an optional
 * reason field, mirroring TokensTab's delete-confirm pattern.
 */
export function ProposalRow({ title, subtitle, meta, canAct, onApprove, onReject }: ProposalRowProps) {
    const reasonFieldId = useId();
    const [isRejecting, setIsRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleApprove = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await onApprove();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRejectOpen = () => {
        setIsRejecting(true);
        setReason('');
        setError('');
    };

    const handleRejectCancel = () => {
        if (isSubmitting) return;
        setIsRejecting(false);
        setError('');
    };

    const handleRejectConfirm = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await onReject(reason.trim() || undefined);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reject.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="border-b border-app-border last:border-b-0">
            <div className="flex flex-wrap items-start gap-3 px-4 py-4 sm:flex-nowrap sm:gap-4 sm:px-5">
                <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-app-text">{title}</p>
                    {subtitle && <p className="mt-1 text-sm text-app-text-muted">{subtitle}</p>}
                    {meta && <div className="mt-2">{meta}</div>}
                </div>

                {canAct && !isRejecting && (
                    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
                        <button
                            type="button"
                            onClick={() => void handleApprove()}
                            disabled={isSubmitting}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-app-success-bg bg-app-success-bg px-3 text-sm font-medium text-app-success-text transition-colors hover:bg-app-success-solid hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Check className="h-3.5 w-3.5" />
                            )}
                            Approve
                        </button>
                        <button
                            type="button"
                            onClick={handleRejectOpen}
                            disabled={isSubmitting}
                            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-app-danger-bg bg-app-danger-bg px-3 text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-solid hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                        >
                            <X className="h-3.5 w-3.5" />
                            Reject
                        </button>
                    </div>
                )}
            </div>

            {error && !isRejecting && (
                <p className="px-4 pb-3 text-sm text-app-danger-text sm:px-5">{error}</p>
            )}

            {isRejecting && (
                <div className="border-t border-app-danger-bg bg-app-danger-bg px-4 py-4 sm:px-5">
                    <label htmlFor={reasonFieldId} className="mb-1.5 block text-xs font-medium text-app-danger-text">
                        Reason (optional)
                    </label>
                    <textarea
                        id={reasonFieldId}
                        value={reason}
                        onChange={event => setReason(event.target.value)}
                        disabled={isSubmitting}
                        rows={2}
                        className="w-full resize-none rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand disabled:opacity-60"
                    />
                    {error && <p className="mt-2 text-sm text-app-danger-text">{error}</p>}
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => void handleRejectConfirm()}
                            disabled={isSubmitting}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-app-danger-solid px-4 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            {isSubmitting ? 'Rejecting...' : 'Confirm reject'}
                        </button>
                        <button
                            type="button"
                            onClick={handleRejectCancel}
                            disabled={isSubmitting}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-app-border bg-app-surface px-4 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
