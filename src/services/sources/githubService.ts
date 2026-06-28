import { apiClient } from "../apiClient.ts";

export type ConnectGithubRepositoryRequest = {
    owner: string;
    name: string;
    token?: string; // Kept for compatibility, but the backend currently uses its own GITHUB_PAT
};

export type ConnectGithubRepositoryResponse = {
    transactionId: string;
};

export type UpdateGithubRepositoryResponse = {
    transactionId: string;
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
 * @returns The backend transaction identifier for the accepted connection job.
 * @throws Error if the connection request fails.
 */
export async function connectGithubRepository(
    request: ConnectGithubRepositoryRequest,
): Promise<ConnectGithubRepositoryResponse> {
    const { owner, name } = request;

    return apiClient.fetch<ConnectGithubRepositoryResponse>("/api/v1/github/connect", {
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
export async function updateAllGithubRepositories(): Promise<UpdateGithubRepositoryResponse> {
    return apiClient.fetch<UpdateGithubRepositoryResponse>("/api/v1/github/update-all", {
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
): Promise<UpdateGithubRepositoryResponse> {
    return apiClient.fetch<UpdateGithubRepositoryResponse>("/api/v1/github/update", {
        method: "POST",
        body: JSON.stringify(request),
    });
}
