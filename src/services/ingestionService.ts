import { apiClient } from "./apiClient";
import type {
    IngestionRun,
    SourceIngestionStatus,
} from "../types/ingestionTypes.ts";

/**
 * Fetches the most recent ingestion runs from the backend.
 *
 * @param limit - Maximum number of ingestion runs to fetch. Must be between 1 and 100.
 * @returns A promise resolving to an array of IngestionRun objects.
 */
export async function getIngestionRuns(limit = 50) {
    try {
        return await apiClient.fetch<IngestionRun[]>(`/api/v1/ingestion-runs?limit=${limit}`);
    } catch (error) {
        console.error("Failed to load ingestion runs:", error);
        return [];
    }
}

/**
 * Fetches the latest ingestion status for all available source systems from the backend.
 *
 * @returns A promise resolving to an array of SourceIngestionStatus objects.
 */
export async function getIngestionStatus() {
    try {
        return await apiClient.fetch<SourceIngestionStatus[]>(`/api/v1/ingestion-status`);
    } catch (error) {
        console.error("Failed to load ingestion status:", error);
        return [
            { sourceSystem: "GITHUB", ingestedCount: 0, updatedCount: 0, failedCount: 0, lastRunTime: null, failedItems: [] },
            { sourceSystem: "JIRA", ingestedCount: 0, updatedCount: 0, failedCount: 0, lastRunTime: null, failedItems: [] },
            { sourceSystem: "UPLOAD", ingestedCount: 0, updatedCount: 0, failedCount: 0, lastRunTime: null, failedItems: [] },
        ];
    }
}
