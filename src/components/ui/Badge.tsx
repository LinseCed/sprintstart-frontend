import type { ReactNode } from "react";

export type BadgeVariant = "success" | "brand" | "warning" | "neutral" | "danger";

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
