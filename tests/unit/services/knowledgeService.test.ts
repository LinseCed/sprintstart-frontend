import { describe, it, expect, vi, beforeEach } from 'vitest';
import { knowledgeService } from '../../../src/services/knowledgeService';
import { mockKnowledgeItems } from '../../../src/mocks/knowledgeBaseMocks';

// Mock the environment toggle to ensure we test the MOCK branch logic
vi.mock('../../../src/config/keycloak', () => ({
    default: {
        authenticated: true,
        token: 'fake-token',
        updateToken: vi.fn().mockResolvedValue(true),
        login: vi.fn(),
    }
}));

describe('knowledgeService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUnifiedArtifacts', () => {
        it('returns mock data when USE_MOCKS is true', async () => {
            const artifacts = await knowledgeService.getUnifiedArtifacts('default');
            expect(artifacts).toHaveLength(mockKnowledgeItems.length);
            expect(artifacts[0].id).toBe('1');
        });
    });

    describe('getArtifactContent', () => {
        it('returns mocked content for a valid artifact', async () => {
            const content = await knowledgeService.getArtifactContent('default', '1');
            expect(content.mimeType).toBe('text/markdown');
            expect(content.content).toContain('API Authentication Guide');
        });

        it('throws an error for an invalid artifact', async () => {
            await expect(knowledgeService.getArtifactContent('default', 'invalid')).rejects.toThrow('Artifact not found');
        });
    });

    describe('summarizeArtifact (mock stream)', () => {
        it('streams mock summary tokens and calls onDone', async () => {
            vi.useFakeTimers();

            const handlers = {
                onToken: vi.fn(),
                onDone: vi.fn(),
                onError: vi.fn()
            };

            const promise = knowledgeService.summarizeArtifact('default', '1', handlers);
            
            // Advance timers by enough time to flush all tokens (approx 50ms per word)
            vi.advanceTimersByTime(2000);
            
            await promise;

            expect(handlers.onToken).toHaveBeenCalled();
            expect(handlers.onDone).toHaveBeenCalled();
            expect(handlers.onError).not.toHaveBeenCalled();

            vi.useRealTimers();
        });
    });
});
