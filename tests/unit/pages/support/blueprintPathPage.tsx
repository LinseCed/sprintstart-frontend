import { render } from "@testing-library/react";
import { service } from "./blueprintPathMocks.ts";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LocationProbe } from "./LocationProbe.tsx";
import { BlueprintPathDetailPage } from "../../../../src/pages/BlueprintPathDetailPage.tsx";
import type { BlueprintPath } from "../../../../src/features/blueprints/types.ts";

export const PROJECT_SCOPE = { kind: "project", projectId: "project-1" };

type Overrides = Partial<BlueprintPath> & Record<string, unknown>;

/** A path with one phase that has one step (a task and a resource) and one question. */
export function pathFixture(status: BlueprintPath["status"] = "DRAFT", overrides: Overrides = {}) {
  return {
    id: "path-1",
    blueprintKey: "key-1",
    projectId: "project-1",
    version: 3,
    revision: 0,
    status,
    title: "Backend onboarding",
    description: "For new backend hires",
    blueprintPhases: [
      {
        id: "phase-1",
        blueprintPathId: "path-1",
        revision: 1,
        position: 0,
        title: "Get set up",
        description: "Tooling and access",
        type: "FIXED",
        aiPrompt: null,
        graphX: 0,
        graphY: 0,
        blockerIds: [],
        requirements: [],
        blueprintSteps: [],
        blueprintCheckQuestions: [],
      },
    ],
    ...overrides,
  } as unknown as BlueprintPath;
}

export function graphFixture(path: BlueprintPath) {
  return {
    nodes: path.blueprintPhases.map((phase) => ({
      id: phase.id,
      revision: phase.revision,
      title: phase.title,
      graphX: phase.graphX,
      graphY: phase.graphY,
      blockerIds: phase.blockerIds,
    })),
  };
}

/** Serves `path` (and its graph) for its own id, ready for the page to load. */
export function servePath(path: BlueprintPath) {
  service.getPath.mockImplementation((_scope: unknown, id: unknown) =>
    Promise.resolve(id === path.id ? path : { ...path, id }),
  );
  service.getGraph.mockResolvedValue(graphFixture(path));
}

/** Renders the page at `entry`, with the list page and the current URL observable. */
export function renderPage(entry = "/blueprints/path-1") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <LocationProbe />
      <Routes>
        <Route path="/blueprints" element={<p>Blueprint list</p>} />
        <Route path="/blueprints/:pathId" element={<BlueprintPathDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}
