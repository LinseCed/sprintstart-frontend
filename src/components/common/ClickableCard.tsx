import type { KeyboardEvent, ReactNode } from "react";

type ClickableCardProps = {
    /** Invoked when the card itself (not a nested interactive element) is activated. */
    onClick: () => void;
    className?: string;
    children: ReactNode;
    "aria-label"?: string;
};

/**
 * Makes an entire dashboard widget card clickable/keyboard-activatable (Enter
 * or Space) instead of requiring a separate "See all" affordance.
 *
 * Nested interactive elements (links, buttons for individual list items)
 * must call `event.stopPropagation()` in their own click handler — otherwise
 * clicking them would also trigger this card's `onClick` and navigate away
 * from the intended target.
 */
export function ClickableCard({
    onClick,
    className,
    children,
    ...rest
}: ClickableCardProps) {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            className={className}
            {...rest}
        >
            {children}
        </div>
    );
}
