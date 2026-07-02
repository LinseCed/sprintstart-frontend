import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type SidePanelProps = {
    isOpen: boolean;
    onClose: () => void;
    title?: ReactNode;
    description?: ReactNode;
    leading?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    widthClassName?: string;
    zIndexClassName?: string;
    showOverlay?: boolean;
    overlayClassName?: string;
    panelClassName?: string;
    panelBackgroundClassName?: string;
    contentClassName?: string;
    headerClassName?: string;
    headerDividerClassName?: string;
    footerClassName?: string;
    closeAriaLabel?: string;
    closeOnEscape?: boolean;
};

export function SidePanel({
    isOpen,
    onClose,
    title,
    description,
    leading,
    badge,
    actions,
    children,
    footer,
    widthClassName = "w-full max-w-xl sm:w-[34rem]",
    zIndexClassName = "z-50",
    showOverlay = true,
    overlayClassName = "bg-app-overlay",
    panelClassName = "",
    panelBackgroundClassName = "bg-app-bg",
    contentClassName = "px-6 py-6",
    headerClassName = "px-6 py-5",
    headerDividerClassName = "border-b border-app-border",
    footerClassName = "border-t border-app-border bg-app-bg px-6 py-5",
    closeAriaLabel = "Close details",
    closeOnEscape = true,
}: SidePanelProps) {
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [closeOnEscape, isOpen, onClose]);

    return (
        <>
            {showOverlay && isOpen && (
                <button
                    type="button"
                    aria-label={closeAriaLabel}
                    onClick={onClose}
                    className={`fixed inset-0 ${zIndexClassName} ${overlayClassName}`}
                />
            )}

            <aside
                className={`fixed inset-y-0 right-0 ${zIndexClassName} flex h-screen ${widthClassName} flex-col overflow-hidden rounded-l-[28px] border-l border-app-border ${panelBackgroundClassName} shadow-2xl transition-[transform,opacity] duration-300 ease-out ${
                    isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                } ${panelClassName}`}
                aria-hidden={!isOpen}
            >
                {(title || description || leading || badge || actions) && (
                    <div className={`${headerDividerClassName} ${headerClassName}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-4">
                                {leading}

                                <div className="min-w-0">
                                    {title && (
                                        <h2 className="break-words text-xl font-bold leading-tight text-app-text">
                                            {title}
                                        </h2>
                                    )}

                                    {description && (
                                        <div className="mt-1 text-sm leading-relaxed text-app-text-muted">
                                            {description}
                                        </div>
                                    )}

                                    {badge && (
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-app-text-muted">
                                            {badge}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {actions}

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-app-border p-2 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                    aria-label={closeAriaLabel}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto [scrollbar-gutter:auto]">
                    <div className={contentClassName}>{children}</div>
                </div>

                {footer && (
                    <div className={footerClassName}>
                        {footer}
                    </div>
                )}
            </aside>
        </>
    );
}
