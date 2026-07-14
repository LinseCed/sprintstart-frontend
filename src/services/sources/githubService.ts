import { apiClient } from "../apiClient.ts";

export type ConnectGithubRepositoryRequest = {
  owner: string;
  name: string;
  tokenName: string;
  projectId: string;
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
  return apiClient.fetch<ConnectGithubRepositoryResponse>(
    "/api/v1/github/connect",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export async function getGithubPatNames(): Promise<string[]> {
  return apiClient.fetch<string[]>("/api/v1/github/pat");
}

export async function addGithubPat(name: string, token: string): Promise<void> {
  await apiClient.fetch<void>("/api/v1/github/pat", {
    method: "POST",
    body: JSON.stringify({ name, token }),
  });
}

export async function updateGithubPat(
  name: string,
  newToken: string,
): Promise<void> {
  await apiClient.fetch<void>("/api/v1/github/pat/update", {
    method: "PUT",
    body: JSON.stringify({ name, newToken }),
  });
}

export async function deleteGithubPat(name: string): Promise<void> {
  await apiClient.fetch<void>("/api/v1/github/pat/delete", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function updateAllGithubRepositories(): Promise<
  UpdateGithubRepositoryResponse[]
> {
  return apiClient.fetch<UpdateGithubRepositoryResponse[]>(
    "/api/v1/github/update-all",
    {
      method: "POST",
    },
  );
}

export async function updateGithubRepository(
  request: UpdateGithubRepositoryRequest,
): Promise<UpdateGithubRepositoryResponse> {
  return apiClient.fetch<UpdateGithubRepositoryResponse>(
    "/api/v1/github/update",
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}
