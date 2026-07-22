import { describe, it, expect, vi, beforeEach } from 'vitest';
import { knowledgeRequestService } from '../../../src/services/knowledgeRequestService';
import { apiClient } from '../../../src/services/apiClient';

describe('knowledgeRequestService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('escalates a question with the project scope in the body', async () => {
        const request = { id: 'r1', projectId: 'p1', hireId: 'h1', question: 'How do I run it?' };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(request);

        await expect(knowledgeRequestService.escalate('p1', 'How do I run it?')).resolves.toEqual(
            request,
        );
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/knowledge-requests', {
            method: 'POST',
            body: JSON.stringify({ projectId: 'p1', question: 'How do I run it?' }),
        });
    });

    it('reads the hire own escalations from the /me route', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue([]);

        await knowledgeRequestService.listMine();
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/me/knowledge-requests');
    });

    it('reads the PM inbox scoped by projectId', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue([]);

        await knowledgeRequestService.listOpen('p 1');
        // projectId is URL-encoded so ids with spaces or reserved chars stay intact.
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/knowledge-requests?projectId=p%201');
    });

    it('answers a request, carrying the optional generalised question', async () => {
        const answer = { id: 'a1', question: 'How do I run it?', answer: './gradlew bootRun' };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(answer);

        await expect(
            knowledgeRequestService.answer('r1', './gradlew bootRun', 'How do I run it?'),
        ).resolves.toEqual(answer);
        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/v1/onboarding/knowledge-requests/r1/answer',
            {
                method: 'POST',
                body: JSON.stringify({ answer: './gradlew bootRun', question: 'How do I run it?' }),
            },
        );
    });

    it('dismisses a request with a POST and no body', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(undefined);

        await knowledgeRequestService.dismiss('r1');
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/knowledge-requests/r1/dismiss', {
            method: 'POST',
        });
    });

    it('lists durable answers scoped by projectId', async () => {
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue([]);

        await knowledgeRequestService.listAnswers('p1');
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/canonical-answers?projectId=p1');
    });

    it('edits a durable answer with a PUT', async () => {
        const answer = { id: 'a1', question: 'q', answer: 'updated' };
        const fetchSpy = vi.spyOn(apiClient, 'fetch').mockResolvedValue(answer);

        await expect(knowledgeRequestService.editAnswer('a1', 'q', 'updated')).resolves.toEqual(
            answer,
        );
        expect(fetchSpy).toHaveBeenCalledWith('/api/v1/onboarding/canonical-answers/a1', {
            method: 'PUT',
            body: JSON.stringify({ question: 'q', answer: 'updated' }),
        });
    });

    it('propagates backend failures instead of swallowing them', async () => {
        vi.spyOn(apiClient, 'fetch').mockRejectedValue(new Error('boom'));

        await expect(knowledgeRequestService.escalate('p1', 'q')).rejects.toThrow('boom');
    });
});
