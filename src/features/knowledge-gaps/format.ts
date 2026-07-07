// Shared display formatters for the knowledge-gaps feature.

/**
 * Formats an ISO timestamp as a short, approximate "time ago" string
 * (e.g. "Today", "Yesterday", "5d ago", "3mo ago") for list/overview UIs.
 */
export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Formats an ISO timestamp as an absolute date (e.g. "05 Jul 2026") for the
 * detail view, where the exact day matters.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
