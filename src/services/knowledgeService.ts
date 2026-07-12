import { apiClient } from "./apiClient";
import {
  DocumentStatus,
  type DocumentMetadata,
  type UploadResult,
} from "./types";

type UploadListItemResponse = {
  id: string;
  filename: string;
  mime: string;
  uploadedAt: string;
};

type UploadArtifactResponse = {
  id: string | null;
  filename: string;
  status: string;
  error?: string | null;
};

type ArtifactResponse = {
  id: string;
  title: string | null;
  sourceSystem: string;
  sourceUrl: string | null;
  artifactType: string;
  ingestedAt: string;
  metadata: string;
};

type ArtifactPageResponse = {
  items: ArtifactResponse[];
};

function normalizeUploadStatus(status: string): UploadResult["status"] {
  return status.trim().toLowerCase() === "failed" ? "failed" : "ok";
}

function toUploadResult(item: UploadArtifactResponse): UploadResult {
  return {
    id: item.id ?? "",
    filename: item.filename,
    status: normalizeUploadStatus(item.status),
    error: item.error ?? undefined,
  };
}

function artifactTitle(item: ArtifactResponse) {
  return (
    item.title ||
    item.sourceUrl?.split("/").filter(Boolean).at(-1) ||
    `${item.sourceSystem} ${item.artifactType}`
  );
}

function artifactMime(item: ArtifactResponse) {
  if (item.artifactType === "FILE") return "text/markdown";
  return "application/json";
}

function toDocument(item: ArtifactResponse): DocumentMetadata {
  return {
    id: item.id,
    name: artifactTitle(item),
    mime: artifactMime(item),
    status: DocumentStatus.COMPLETED,
    uploadDate: item.ingestedAt,
  };
}

function uploadItemToDocument(item: UploadListItemResponse): DocumentMetadata {
  return {
    id: item.id,
    name: item.filename,
    mime: item.mime,
    status: DocumentStatus.COMPLETED,
    uploadDate: item.uploadedAt,
  };
}

function appendJsonPart(formData: FormData, name: string, value: unknown) {
  formData.append(
    name,
    new Blob([JSON.stringify(value)], { type: "application/json" }),
  );
}

export const knowledgeService = {
  async fetchDocuments(
    uploaderId: string,
    projectId?: string,
  ): Promise<DocumentMetadata[]> {
    if (projectId) {
      const page = await apiClient.fetch<ArtifactPageResponse>(
        `/api/v1/projects/${projectId}/artifacts?page=1&size=100`,
      );

      return page.items.map(toDocument);
    }

    const data = await apiClient.fetch<UploadListItemResponse[]>(
      `/api/v1/uploads?uploaderId=${uploaderId}`,
    );

    return data.map(uploadItemToDocument);
  },

  async uploadDocuments(
    files: File[],
    uploaderId: string,
    projectId: string,
  ): Promise<UploadResult[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    appendJsonPart(formData, "request", { uploaderId, projectId });

    const results = await apiClient.fetch<UploadArtifactResponse[]>(
      "/api/v1/uploads",
      {
        method: "POST",
        body: formData,
      },
    );

    return results.map(toUploadResult);
  },

  async deleteDocument(
    id: string,
    removerId: string,
    projectId: string,
  ): Promise<void> {
    const formData = new FormData();
    appendJsonPart(formData, "request", {
      artifactIds: [id],
      removerId,
      projectId,
    });

    await apiClient.fetch<void>(`/api/v1/uploads/${id}`, {
      method: "DELETE",
      body: formData,
    });
  },
};
