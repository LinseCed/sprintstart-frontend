import { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FileUploadZone } from './FileUploadZone';
import { knowledgeService } from '../../../services/knowledgeService';

/**
 * Props for the UploadArtifactModal component.
 */
interface UploadArtifactModalProps {
    isOpen: boolean;
    /** Closes the modal and resets upload state in the parent. */
    onClose: () => void;
    /** Project scope the uploaded files will be ingested into. */
    projectId: string;
    /** Fired once a batch fully succeeds, so the parent can refetch the list. */
    onUploadSuccess?: () => void;
}

/**
 * UploadArtifactModal
 *
 * Orchestrates the batch upload process of user documents into the knowledge base.
 * Provides feedback on success or failure for each individual file ingested. The
 * component must stay mounted while open so its exit animation can play — the parent
 * wraps it in `<AnimatePresence>` and toggles `isOpen`.
 */
export function UploadArtifactModal({ isOpen, onClose, projectId, onUploadSuccess }: UploadArtifactModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [batchResult, setBatchResult] = useState<{
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);

    // Holds the auto-close timer so we can cancel it if the modal unmounts first.
    const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        return () => {
            if (autoCloseTimerRef.current !== null) {
                clearTimeout(autoCloseTimerRef.current);
                autoCloseTimerRef.current = null;
            }
        };
    }, []);

    // Focus trap + Esc-to-close + focus restore. Mirrors the SidePanel pattern so
    // the modal is keyboard-accessible (WCAG 2.1 AA) and consistent with the drawer.
    useEffect(() => {
        if (!isOpen) {
            previouslyFocusedRef.current?.focus();
            return;
        }

        previouslyFocusedRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const animationFrameId = window.requestAnimationFrame(() => {
            const modal = modalRef.current;
            if (!modal) return;
            const focusable = modal.querySelector<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            (focusable ?? modal).focus();
        });

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && !isUploading) {
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;

            const modal = modalRef.current;
            if (!modal) return;

            const focusableElements = Array.from(
                modal.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((el) => !el.hasAttribute('aria-hidden'));

            if (focusableElements.length === 0) {
                event.preventDefault();
                modal.focus();
                return;
            }

            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, isUploading]);

    /**
     * Submits the selected files to the backend for ingestion.
     * Parses the batch results to display per-file success/error states.
     */
    const handleUpload = async (files: File[]) => {
        setIsUploading(true);
        setBatchResult(null);

        try {
            const results = await knowledgeService.uploadDocuments(projectId, files);

            const successfulResults = results.filter((r) => r.status === 'success');
            const failedResults = results.filter((r) => r.status === 'error');

            setBatchResult({
                success: successfulResults.length,
                failed: failedResults.length,
                errors: failedResults.map((r) => `${r.filename}: ${r.error}`),
            });

            // Close automatically after a fully-successful batch, or leave open if errors.
            if (failedResults.length === 0) {
                onUploadSuccess?.();
                autoCloseTimerRef.current = setTimeout(() => {
                    autoCloseTimerRef.current = null;
                    setBatchResult(null);
                    onClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setBatchResult({
                success: 0,
                failed: files.length,
                errors: ['Upload failed due to a network or server error.'],
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-app-overlay p-4 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isUploading) onClose();
                    }}
                >
                    <motion.div
                        ref={modalRef}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-2xl rounded-2xl bg-app-bg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] focus:outline-none"
                        data-testid="upload-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        tabIndex={-1}
                    >
                        <div className="flex items-center justify-between border-b border-app-border px-6 py-4">
                            <h2 id={titleId} className="text-xl font-semibold text-app-text">Upload Artifacts</h2>
                            <button
                                onClick={onClose}
                                disabled={isUploading}
                                className="rounded-lg p-2 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus:outline-none focus:ring-2 focus:ring-app-focus disabled:opacity-50"
                                aria-label="Close upload modal"
                                data-testid="upload-modal-close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="space-y-6">
                                <p className="text-sm text-app-text-subtle">
                                    Select or drag and drop .md, .pdf, or image files to add them to the knowledge base.
                                </p>

                                <FileUploadZone
                                    onUpload={(files) => {
                                        void handleUpload(files);
                                    }}
                                    isUploading={isUploading}
                                />

                                <AnimatePresence>
                                    {batchResult && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div
                                                aria-live="polite"
                                                className={`mt-4 flex flex-col gap-2 rounded-xl border p-4 ${
                                                    batchResult.failed > 0
                                                        ? 'border-app-warning-border bg-app-warning-bg text-app-warning-text'
                                                        : 'border-app-success-border bg-app-success-bg text-app-success-text'
                                                }`}
                                                data-testid="upload-batch-result"
                                            >
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="flex items-center gap-3 font-semibold">
                                                        {batchResult.failed > 0 ? (
                                                            <AlertTriangle className="h-5 w-5 text-app-warning-text" />
                                                        ) : (
                                                            <CheckCircle2 className="h-5 w-5 text-app-success-text" />
                                                        )}
                                                        Upload Complete: {batchResult.success} ingested, {batchResult.failed} failed
                                                    </span>
                                                </div>

                                                {batchResult.errors.length > 0 && (
                                                    <ul className="mt-2 list-inside list-disc space-y-1 pl-8 text-sm text-app-warning-text">
                                                        {batchResult.errors.map((err, i) => (
                                                            <li key={`${i}-${err}`}>{err}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
