import { apiClient } from "../apiClient.ts";

export type ConnectGithubRepositoryRequest = {
    owner: string;
    name: string;
    token?: string; // Kept for compatibility, but the backend currently uses its own GITHUB_PAT
};

export type UpdateGithubRepositoryRequest = {
    owner: string;
    name: string;
};

/**
 * Connects a GitHub repository to SprintStart by notifying the backend.
 * The backend handles the actual ingestion asynchronously.
 *
 * @param request - The GitHub repository owner and repository name.
 * @throws Error if the connection request fails.
 */
export async function connectGithubRepository(
    request: ConnectGithubRepositoryRequest,
): Promise<void> {
    const { owner, name } = request;

    await apiClient.fetch("/api/v1/github/connect", {
        method: "POST",
        body: JSON.stringify({
            owner,
            name,
        }),
    });
}

/**
 * Triggers an update for all connected GitHub repositories.
 */
export async function updateAllGithubRepositories(): Promise<void> {
    await apiClient.fetch("/api/v1/github/update-all", {
        method: "POST",
    });
}

/**
 * Triggers an update for a specific connected GitHub repository.
 *
 * @param request - The GitHub repository owner and repository name.
 */
export async function updateGithubRepository(
    request: UpdateGithubRepositoryRequest,
): Promise<void> {
    await apiClient.fetch("/api/v1/github/update", {
        method: "POST",
        body: JSON.stringify(request),
    });
}
