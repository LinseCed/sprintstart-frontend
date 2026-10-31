import { describe, expect, it } from "vitest";
import {
  knowledgeBaseOf,
  shouldRenderAsMarkdown,
} from "../../../../src/features/knowledge-base/artifactPresentation";
import type { Artifact, ArtifactContent } from "../../../../src/features/knowledge-base/types";

function artifact(overrides: Partial<Artifact> = {}): Artifact {
  return {
    id: "a-1",
    title: "notes.txt",
    artifactType: "FILE",
    sourceSystem: "GITHUB",
    sourceId: "s-1",
    sourceUrl: null,
    mime: "text/plain",
    language: null,
    ingestedAt: "2026-01-01T00:00:00Z",
    lastChangedAt: null,
    contentHash: "h",
    ingestionRunId: null,
    ...overrides,
  };
}

function content(mimeType = "text/plain"): ArtifactContent {
  return { content: "body", mimeType, isObjectUrl: false };
}

describe("shouldRenderAsMarkdown", () => {
  it("is false without content, whatever the artifact", () => {
    expect(shouldRenderAsMarkdown(null, artifact({ title: "a.md" }))).toBe(false);
    expect(shouldRenderAsMarkdown(undefined, artifact({ artifactType: "ISSUE" }))).toBe(false);
  });

  it("is false for plain content of an ordinary file", () => {
    expect(shouldRenderAsMarkdown(content(), artifact())).toBe(false);
    expect(shouldRenderAsMarkdown(content(), null)).toBe(false);
  });

  it("follows a markdown mime type, charset suffix included", () => {
    expect(shouldRenderAsMarkdown(content("text/markdown"), artifact())).toBe(true);
    expect(shouldRenderAsMarkdown(content("text/markdown; charset=utf-8"), null)).toBe(true);
  });

  it.each(["a.md", "a.markdown", "a.mdown", "a.mkd", "README.MD"])(
    "renders the file %s as markdown",
    (title) => {
      expect(shouldRenderAsMarkdown(content(), artifact({ title }))).toBe(true);
    },
  );

  it.each(["a.mdx", "md", "a.md.txt"])("does not take %s for markdown", (title) => {
    expect(shouldRenderAsMarkdown(content(), artifact({ title }))).toBe(false);
  });

  it.each(["ISSUE", "PULL_REQUEST"] as const)("renders a %s as markdown", (artifactType) => {
    expect(shouldRenderAsMarkdown(content(), artifact({ artifactType }))).toBe(true);
  });

  it.each(["PR #12 fix", "Pull request 4", "Issue #9", "JIRA #77"])(
    "renders the title %s as markdown",
    (title) => {
      expect(shouldRenderAsMarkdown(content(), artifact({ title }))).toBe(true);
    },
  );

  it.each([
    "https://github.com/o/r/pull/3",
    "https://bitbucket.org/o/r/pull-requests/3",
    "https://github.com/o/r/issues/3",
    "https://acme.atlassian.net/browse/ABC-1",
    "https://ACME.atlassian.net/BROWSE/ABC-1",
  ])("renders the source %s as markdown", (sourceUrl) => {
    expect(shouldRenderAsMarkdown(content(), artifact({ sourceUrl }))).toBe(true);
  });

  it("renders a wiki page by its URL", () => {
    expect(
      shouldRenderAsMarkdown(
        content(),
        artifact({ sourceUrl: "https://acme.atlassian.net/wiki/spaces/ENG/pages/1" }),
      ),
    ).toBe(true);
  });

  it("renders the artifacts of a connector that declares markdown", () => {
    expect(shouldRenderAsMarkdown(content(), artifact({ sourceSystem: "CONFLUENCE" }))).toBe(true);
  });

  it("does not render an unknown source system as markdown", () => {
    expect(shouldRenderAsMarkdown(content(), artifact({ sourceSystem: undefined }))).toBe(false);
  });
});

describe("knowledgeBaseOf", () => {
  it("is undefined for a source system the frontend does not know", () => {
    expect(knowledgeBaseOf(artifact({ sourceSystem: undefined }))).toBeUndefined();
  });

  it("describes a known connector", () => {
    expect(knowledgeBaseOf(artifact({ sourceSystem: "CONFLUENCE" }))?.markdown).toBe(true);
  });
});
