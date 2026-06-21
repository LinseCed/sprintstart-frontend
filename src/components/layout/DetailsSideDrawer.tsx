import type { ReactNode } from "react";
import { X } from "lucide-react";

type DetailsSideDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    leading: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    widthClassName?: string;
    contentClassName?: string;
    closeAriaLabel?: string;
};

export function DetailsSideDrawer({
                                      isOpen,
                                      onClose,
                                      title,
                                      leading,
                                      badge,
                                      actions,
                                      children,
                                      footer,
                                      widthClassName = "w-[min(94vw,34rem)] lg:w-[min(72vw,58rem)]",
                                      contentClassName = "mx-5 px-4 pb-10 pt-5 lg:px-5 lg:pt-6",
                                      closeAriaLabel = "Close details",
                                  }: DetailsSideDrawerProps) {
    return (
        <aside
            className={`fixed inset-y-0 right-0 z-40 flex h-screen ${widthClassName} flex-col rounded-l-3xl border-l border-app-border bg-app-surface shadow-2xl transition-[transform,opacity] duration-300 ease-out ${
                isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}
        >
            <div className="flex-1 overflow-auto [scrollbar-gutter:auto]">
                <div className={contentClassName}>
                    <div className="mb-9 flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-4">
                            {leading}

                            <div className="min-w-0 pt-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <h2 className="truncate text-2xl font-semibold text-app-text">
                                        {title}
                                    </h2>
                                </div>

                                {badge && (
                                    <div className="mt-2 flex items-center gap-1.5 text-sm text-app-text-muted">
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
                                className="rounded-xl p-2 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                aria-label={closeAriaLabel}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {children}
                </div>
            </div>

            {footer && (
                <div className="flex items-center justify-end gap-3 rounded-bl-3xl border-t border-app-border bg-app-surface px-4 py-4 lg:px-5">
                    {footer}
                </div>
            )}
        </aside>
    );
}