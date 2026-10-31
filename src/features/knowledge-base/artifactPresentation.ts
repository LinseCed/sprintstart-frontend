import type { Artifact, ArtifactContent } from "./types";
import { findConnector } from "../data-ingestion/connectors/registry";

/**
 * How the artifact's connector presents it, or undefined for a source system the
 * frontend does not know yet. Such an artifact is shown as plain content with its
 * source link and cannot be deleted.
 */
export function knowledgeBaseOf(artifact: Artifact) {
  return findConnector(artifact.sourceSystem)?.knowledgeBase;
}

const MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mkd"];
const PR_OR_ISSUE_TITLE_PREFIXES = ["pr #", "pull request", "issue #", "jira #"];
const PR_OR_ISSUE_URL_PARTS = ["/pull/", "/pull-requests/", "/issues/", "/browse/"];

function lowercased(value: string | null | undefined): string {
  return value?.toLowerCase() ?? "";
}

function isMarkdownFile(title: string): boolean {
  return MARKDOWN_EXTENSIONS.some((extension) => title.endsWith(extension));
}

function isPullRequestOrIssue(artifact: Artifact | null, title: string, sourceUrl: string) {
  return (
    artifact?.artifactType === "ISSUE" ||
    artifact?.artifactType === "PULL_REQUEST" ||
    PR_OR_ISSUE_TITLE_PREFIXES.some((prefix) => title.startsWith(prefix)) ||
    PR_OR_ISSUE_URL_PARTS.some((part) => sourceUrl.includes(part))
  );
}

function isWikiPage(artifact: Artifact | null, sourceUrl: string): boolean {
  const connectorRendersMarkdown =
    artifact !== null && knowledgeBaseOf(artifact)?.markdown === true;
  return connectorRendersMarkdown || sourceUrl.includes("/wiki/spaces/");
}

/**
 * Determines whether an artifact should be rendered as Markdown.
 * Issues, Pull Requests, Jira items, Confluence artifacts, and Markdown files (.md/.markdown) are always rendered as Markdown.
 * Confluence is detected via sourceSystem or a /wiki/spaces/ URL pattern.
 */
export const shouldRenderAsMarkdown = (
  content: ArtifactContent | null | undefined,
  artifact: Artifact | null,
): boolean => {
  if (!content) return false;
  const title = lowercased(artifact?.title);
  const sourceUrl = lowercased(artifact?.sourceUrl);

  return (
    content.mimeType.startsWith("text/markdown") ||
    isPullRequestOrIssue(artifact, title, sourceUrl) ||
    isMarkdownFile(title) ||
    isWikiPage(artifact, sourceUrl)
  );
};
