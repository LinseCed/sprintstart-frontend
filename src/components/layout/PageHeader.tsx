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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-app-brand text-white shadow-sm">
                        <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-app-text sm:text-2xl">
                            {title}
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm leading-6 text-app-text-subtle">
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
