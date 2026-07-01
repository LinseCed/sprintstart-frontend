import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type PageHeaderProps = {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({
    icon: Icon,
    title,
    subtitle,
    actions,
    className = "",
}: PageHeaderProps) {
    return (
        <div className={className}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-app-brand-border bg-app-brand-soft text-app-brand-text shadow-sm">
                        <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 pt-0.5">
                        <h1 className="text-xl font-bold tracking-tight text-app-text sm:text-2xl">
                            {title}
                        </h1>

                        <p className="mt-1 max-w-3xl text-sm leading-6 text-app-text-muted">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {actions ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {actions}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
