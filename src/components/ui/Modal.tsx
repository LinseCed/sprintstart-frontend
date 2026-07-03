import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl";

type ModalProps = {
    isOpen: boolean;
    title: string;
    description?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    size?: ModalSize;
    zIndexClassName?: string;
    bodyClassName?: string;
    role?: "dialog" | "alertdialog";
    closeLabel?: string;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    isDismissDisabled?: boolean;
    titleId?: string;
    descriptionId?: string;
    onClose: () => void;
};

const sizeClassNames: Record<ModalSize, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

export function Modal({
    isOpen,
    title,
    description,
    children,
    footer,
    size = "md",
    zIndexClassName = "z-50",
    bodyClassName = "px-7 py-6",
    role = "dialog",
    closeLabel = "Close dialog",
    closeOnBackdrop = true,
    closeOnEscape = true,
    isDismissDisabled = false,
    titleId = "modal-title",
    descriptionId = "modal-description",
    onClose,
}: ModalProps) {
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && !isDismissDisabled) {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeOnEscape, isDismissDisabled, isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 ${zIndexClassName} flex items-center justify-center bg-app-overlay p-4 backdrop-blur-md`}
        >
            {closeOnBackdrop && (
                <button
                    type="button"
                    aria-label={closeLabel}
                    disabled={isDismissDisabled}
                    onClick={onClose}
                    className="absolute inset-0 disabled:cursor-default"
                />
            )}

            <div
                role={role}
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className={`relative z-10 w-full ${sizeClassNames[size]} overflow-hidden rounded-[28px] border border-app-border bg-app-bg shadow-2xl`}
            >
                <div className="pointer-events-none absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-app-brand-glow blur-3xl" />

                <div className="relative z-10 flex items-start justify-between gap-4 px-7 pt-7">
                    <div>
                        <h2
                            id={titleId}
                            className="text-[22px] font-bold leading-tight text-app-text"
                        >
                            {title}
                        </h2>

                        {description && (
                            <div
                                id={descriptionId}
                                className="mt-1 text-xs leading-relaxed text-app-text-muted"
                            >
                                {description}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDismissDisabled}
                        className="rounded-lg border border-app-border p-2 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={closeLabel}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {children && (
                    <div className={`relative z-10 ${bodyClassName}`}>
                        {children}
                    </div>
                )}

                {footer && (
                    <div
                        className={`relative z-10 flex flex-col-reverse gap-3 px-7 pb-7 sm:flex-row sm:justify-end ${
                            children ? "" : "pt-6"
                        }`}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
