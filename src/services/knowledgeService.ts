import { apiClient } from './apiClient';
import { DocumentStatus, type DocumentMetadata, type UploadResult } from './types';

/**
 * Service responsible for managing the knowledge base, including file uploads,
 * document retrieval, and deletion.
 */
export const knowledgeService = {
    /**
     * Fetches all documents uploaded by a specific user from the backend.
     * 
     * @param uploaderId - The unique ID of the user who uploaded the files.
     * @returns A promise resolving to an array of document metadata.
     */
    async fetchDocuments(uploaderId: string): Promise<DocumentMetadata[]> {
        try {
            const data = await apiClient.fetch<Array<{
                id: string;
                filename: string;
                mime: string;
                uploadedAt: string;
            }>>(`/api/v1/uploads?uploaderId=${uploaderId}`);

            return data.map(item => ({
                id: item.id,
                name: item.filename,
                mime: item.mime,
                status: DocumentStatus.COMPLETED,
                uploadDate: item.uploadedAt
            }));
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            return [];
        }
    },

    /**
     * Uploads one or more files to the knowledge base on the backend.
     * 
     * @param files - Array of File objects to upload.
     * @param uploaderId - The unique ID of the user performing the upload.
     * @returns A promise resolving to an array of UploadResult objects.
     */
    async uploadDocuments(files: File[], uploaderId: string): Promise<UploadResult[]> {
        const results: UploadResult[] = [];
        
        for (const file of files) {
            const formData = new FormData();
            formData.append('files', file);

            try {
                const uploadResults = await apiClient.fetch<UploadResult[]>(`/api/v1/uploads?uploaderId=${uploaderId}`, {
                    method: 'POST',
                    body: formData,
                });
                results.push(...uploadResults);
            } catch (error) {
                console.error(`Failed to upload file ${file.name}:`, error);
                results.push({
                    id: '',
                    filename: file.name,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return results;
    },

    /**
     * Deletes a specific document from the knowledge base by its ID.
     * 
     * @param id - The unique identifier of the document to delete.
     * @returns A promise that resolves when the deletion is successful.
     */
    async deleteDocument(id: string): Promise<void> {
        await apiClient.fetch(`/api/v1/uploads/${id}`, {
            method: 'DELETE',
        });
    }
};
