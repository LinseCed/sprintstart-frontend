import type { ReactNode } from "react";

export type BadgeVariant =
    | "success"
    | "brand"
    | "warning"
    | "neutral"
    | "danger"
    | "purple"
    | "pink"
    | "yellow"
    | "navy"
    | "orange";

export type BadgeProps = {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
};

const badgeVariantClasses: Record<BadgeVariant, string> = {
    success: "border-app-success-border bg-app-success-bg text-app-success-text",
    brand: "border-app-brand-border bg-app-brand-soft text-app-brand-text",
    warning: "border-app-warning-border bg-app-warning-bg text-app-warning-text",
    neutral: "border-app-neutral-border bg-app-neutral-bg text-app-neutral-text",
    danger: "border-app-danger-border bg-app-danger-bg text-app-danger-text",
    purple:
        "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200",
    pink:
        "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/40 dark:bg-pink-500/15 dark:text-pink-200",
    yellow:
        "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/15 dark:text-yellow-200",
    navy:
        "border-blue-900/20 bg-blue-950 text-white dark:border-blue-400/40 dark:bg-blue-400/15 dark:text-blue-100",
    orange:
        "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-200",
};

export function Badge({ children, variant = "brand", className = "" }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold leading-none ${badgeVariantClasses[variant]} ${className}`.trim()}
        >
            {children}
        </span>
    );
}
