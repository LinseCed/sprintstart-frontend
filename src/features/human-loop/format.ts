/**
 * Human-loop duration helpers. The surface talks in plain elapsed time ("3 days
 * ago", "5 hours"), never raw hour/day counts, because the audience is a nervous
 * newcomer, not a dashboard.
 */

/** "just now" / "5 hours" / "2 days" from a count of hours. */
export function formatHours(hours: number): string {
    if (hours < 1) return 'less than an hour';
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'}`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
}

/** "today" / "yesterday" / "3 days ago" from a count of days. */
export function formatDaysAgo(days: number): string {
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    return `${days} days ago`;
}

/** First token of a display name, for warmer second-person copy ("Ask Ada"). */
export function firstName(displayName: string): string {
    return displayName.trim().split(/\s+/)[0] || displayName;
}
