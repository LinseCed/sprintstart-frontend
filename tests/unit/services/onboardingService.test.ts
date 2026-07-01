/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onboardingService } from '../../../src/services/onboardingService';
import { apiClient } from '../../../src/services/apiClient';
import keycloak from '../../../src/config/keycloak';

vi.mock('../../../src/services/apiClient', () => ({
    apiClient: {
        fetch: vi.fn(),
    }
}));

vi.mock('../../../src/config/keycloak', () => ({
    default: {
        authenticated: true,
        updateToken: vi.fn().mockResolvedValue(true),
        login: vi.fn(),
        token: 'mock-token',
    }
}));

// Mock global fetch for SSE
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('onboardingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchPath returns path endpoint', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({ id: 'path1' });
        const path = await onboardingService.fetchPath();
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/onboarding/me/path');
        expect(path.id).toBe('path1');
    });

    it('startStep sends PUT request to start endpoint', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({});
        await onboardingService.startStep('step1');
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/onboarding/me/steps/step1/start', {
            method: 'PUT'
        });
    });

    it('personalizePath processes SSE stream events correctly', async () => {
        // Create a fake ReadableStream that emits lines of SSE data
        const encoder = new TextEncoder();
        const chunks = [
            'data: {"type":"stage","name":"Analyzing skills","detail":"Checking JS"}\n\n',
            'data: {"type":"path","path":{"id":"path2"}}\n\n',
            'data: {"type":"done"}\n\n'
        ];
        
        const mockReader = {
            read: vi.fn()
        };
        mockReader.read.mockResolvedValueOnce({ value: encoder.encode(chunks[0]), done: false });
        mockReader.read.mockResolvedValueOnce({ value: encoder.encode(chunks[1]), done: false });
        mockReader.read.mockResolvedValueOnce({ value: encoder.encode(chunks[2]), done: false });
        mockReader.read.mockResolvedValueOnce({ done: true });

        mockFetch.mockResolvedValue({
            ok: true,
            body: { getReader: () => mockReader }
        } as any);

        const handlers = {
            onStage: vi.fn(),
            onPath: vi.fn(),
            onDone: vi.fn(),
            onError: vi.fn(),
        };

        await onboardingService.personalizePath(handlers);

        expect(keycloak.updateToken).toHaveBeenCalledWith(30);
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/onboarding/me/path/personalize', {
            method: 'POST',
            headers: { Authorization: 'Bearer mock-token' }
        });
        
        expect(handlers.onStage).toHaveBeenCalledWith('Analyzing skills', 'Checking JS');
        expect(handlers.onPath).toHaveBeenCalledWith({ id: 'path2' });
        expect(handlers.onDone).toHaveBeenCalled();
        expect(handlers.onError).not.toHaveBeenCalled();
    });

    it('personalizePath calls login if token update fails', async () => {
        vi.mocked(keycloak.updateToken).mockRejectedValueOnce(new Error('Refresh failed'));
        
        const handlers = {
            onStage: vi.fn(),
            onPath: vi.fn(),
            onDone: vi.fn(),
            onError: vi.fn(),
        };

        await onboardingService.personalizePath(handlers);
        expect(keycloak.login).toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('skipStep posts a skip request and returns skip endpoint', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({ id: 'skip1', reason: 'Too hard' });
        
        const res = await onboardingService.skipStep({ id: 'step1' } as any, 'Too hard');
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/onboarding/me/steps/step1/skips', {
            method: 'POST',
            body: JSON.stringify({ reason: 'Too hard' })
        });
        expect(res.id).toBe('skip1');
    });

    it('updateTask updates finished state correctly', async () => {
        vi.mocked(apiClient.fetch).mockResolvedValue({});
        const task = { id: 'task1', position: 1, title: 'T1', description: 'D1' } as any;
        
        await onboardingService.updateTask(task, true);
        expect(apiClient.fetch).toHaveBeenCalledWith('/api/v1/onboarding/me/tasks/task1', {
            method: 'PUT',
            body: JSON.stringify({ position: 1, title: 'T1', description: 'D1', finished: true })
        });
    });
});
