// ============================================================
// AlertDialog.tsx
// ============================================================

import { useEffect, type ReactNode } from "react";

export type AlertDialogVariant = "danger" | "default";

type AlertDialogProps = {
    isOpen: boolean;
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: AlertDialogVariant;
    isLoading?: boolean;
    loadingLabel?: string;
    errorMessage?: string;
    onClose: () => void;
    onConfirm: () => void;
};

export function AlertDialog({
                                isOpen,
                                title,
                                description,
                                confirmLabel = "Confirm",
                                cancelLabel = "Cancel",
                                variant = "default",
                                isLoading = false,
                                loadingLabel = "Working...",
                                errorMessage,
                                onClose,
                                onConfirm,
                            }: AlertDialogProps) {
    useEffect(() => {
        if (!isOpen) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isLoading) {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    const confirmButtonClassName =
        variant === "danger"
            ? "border-app-danger-border bg-app-danger-solid text-white hover:opacity-90"
            : "border-app-brand bg-app-brand text-white hover:border-app-brand-hover hover:bg-app-brand-hover";

    return (
        <div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-app-overlay p-4"
            onMouseDown={() => {
                if (!isLoading) onClose();
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="alert-dialog-title"
                aria-describedby={description ? "alert-dialog-description" : undefined}
                className="w-full max-w-md overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="p-6">
                    <h2
                        id="alert-dialog-title"
                        className="text-lg font-semibold text-app-text"
                    >
                        {title}
                    </h2>

                    {description && (
                        <div
                            id="alert-dialog-description"
                            className="mt-2 text-sm leading-relaxed text-app-text-muted"
                        >
                            {description}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mt-4 rounded-2xl border border-app-danger-border bg-app-danger-bg px-4 py-3 text-sm text-app-danger-text">
                            {errorMessage}
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-app-border bg-app-surface-muted px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-app-border bg-app-surface px-5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${confirmButtonClassName}`}
                    >
                        {isLoading ? loadingLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
