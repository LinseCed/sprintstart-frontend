import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { knowledgeService } from '../../../src/services/knowledgeService';
import { server } from '../../unit/setup/vitest.setup';

vi.mock('../../../src/services/userService', () => ({
    userService: {
        getProfile: vi.fn().mockResolvedValue({ id: 'user1' })
    }
}));

describe('knowledgeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadDocuments', () => {
        it('uploads files and returns their results', async () => {
            server.use(
                http.post('/api/v1/uploads', () => {
                    return HttpResponse.json([{ id: 'up1', filename: 'a.txt', status: 'ok' }]);
                }),
            );

            const file = new File(['content'], 'a.txt', { type: 'text/plain' });
            const results = await knowledgeService.uploadDocuments('p1', [file]);

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({ filename: 'a.txt', status: 'success' });
        });

        it('captures a failed upload as a failed UploadResult', async () => {
            server.use(http.post('/api/v1/uploads', () => HttpResponse.json({}, { status: 500 })));

            const file = new File(['content'], 'bad.txt', { type: 'text/plain' });
            const results = await knowledgeService.uploadDocuments('p1', [file]);

            expect(results).toHaveLength(1);
            expect(results[0].status).toBe('error');
            expect(results[0].filename).toBe('bad.txt');
            expect(results[0].error).toBeTruthy();
        });

        it('uploads multiple files, aggregating success and failure results', async () => {
            let callCount = 0;
            server.use(
                http.post('/api/v1/uploads', () => {
                    callCount += 1;
                    if (callCount === 2) {
                        return HttpResponse.json({}, { status: 500 });
                    }
                    return HttpResponse.json([{ id: 'ok1', filename: 'good.txt', status: 'ok' }]);
                }),
            );

            const goodFile = new File(['a'], 'good.txt');
            const badFile = new File(['b'], 'bad.txt');
            const results = await knowledgeService.uploadDocuments('p1', [goodFile, badFile]);

            expect(results).toHaveLength(2);
            expect(results[0].status).toBe('success');
            expect(results[1].status).toBe('error');
        });
    });

    describe('summarizeArtifact', () => {
        const projectId = 'proj-uuid';
        const artifactId = 'artifact-uuid';

        it('returns the summary and citations on 200', async () => {
            server.use(
                http.post(`/api/v1/projects/${projectId}/artifacts/${artifactId}/summary`, () =>
                    HttpResponse.json({
                        artifactId,
                        summary: '## Key points\nThis is the summary.',
                        citations: [
                            { artifactId, filename: 'README.md', sourceUrl: 'https://github.com/owner/repo/blob/main/README.md' },
                        ],
                    }),
                ),
            );

            const result = await knowledgeService.summarizeArtifact(projectId, artifactId);

            expect(result.artifactId).toBe(artifactId);
            expect(result.summary).toBe('## Key points\nThis is the summary.');
            expect(result.citations).toHaveLength(1);
            expect(result.citations[0].filename).toBe('README.md');
            expect(result.citations[0].sourceUrl).toBe('https://github.com/owner/repo/blob/main/README.md');
        });

        it('throws ApiError on 403', async () => {
            server.use(
                http.post(`/api/v1/projects/${projectId}/artifacts/${artifactId}/summary`, () =>
                    HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
                ),
            );

            await expect(knowledgeService.summarizeArtifact(projectId, artifactId)).rejects.toThrow();
        });

        it('throws ApiError on 404', async () => {
            server.use(
                http.post(`/api/v1/projects/${projectId}/artifacts/${artifactId}/summary`, () =>
                    HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
                ),
            );

            await expect(knowledgeService.summarizeArtifact(projectId, artifactId)).rejects.toThrow();
        });

        it('throws ApiError on 503', async () => {
            server.use(
                http.post(`/api/v1/projects/${projectId}/artifacts/${artifactId}/summary`, () =>
                    HttpResponse.json({ detail: 'AI service unavailable' }, { status: 503 }),
                ),
            );

            await expect(knowledgeService.summarizeArtifact(projectId, artifactId)).rejects.toThrow();
        });
    });
});

