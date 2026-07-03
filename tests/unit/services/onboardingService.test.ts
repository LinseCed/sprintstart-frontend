import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onboardingService } from '../../../src/services/onboardingService';
import { http, HttpResponse } from 'msw';
import { server } from '../../unit/setup/vitest.setup';
import type {
    OnboardingStepDetail,
    OnboardingTaskEndpoint,
} from '../../../src/features/onboarding/types';

describe('onboardingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetchPath returns path endpoint', async () => {
        server.use(
            http.get('/api/v1/onboarding/me/path', () =>
                HttpResponse.json({ id: 'path1', userId: 'user1', createdAt: new Date().toISOString(), phases: [] }),
            ),
        );

        const path = await onboardingService.fetchPath();
        expect(path.id).toBe('path1');
    });

    it('startStep sends PUT request to start endpoint', async () => {
        let captured = false;
        server.use(
            http.put('/api/v1/onboarding/me/steps/step1/start', () => {
                captured = true;
                return new HttpResponse(null, { status: 200 });
            }),
        );

        await onboardingService.startStep('step1');
        expect(captured).toBe(true);
    });

    it('personalizePath processes SSE stream events', async () => {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(
                    encoder.encode('data: {"type":"stage","name":"Analyzing skills","detail":"Checking JS"}\n\n'),
                );
                controller.enqueue(
                    encoder.encode('data: {"type":"path","path":{"id":"path2","userId":"user1","createdAt":"2024-01-01","phases":[]}}\n\n'),
                );
                controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
                controller.close();
            },
        });

        server.use(
            http.post('/api/v1/onboarding/me/path/personalize', () => {
                return new HttpResponse(stream, {
                    headers: { 'Content-Type': 'text/event-stream' },
                });
            }),
        );

        const handlers = {
            onStage: vi.fn(),
            onPath: vi.fn(),
            onDone: vi.fn(),
            onError: vi.fn(),
        };

        await onboardingService.personalizePath(handlers);

        expect(handlers.onStage).toHaveBeenCalledWith('Analyzing skills', 'Checking JS');
        expect(handlers.onPath).toHaveBeenCalledWith(expect.objectContaining({ id: 'path2' }));
        expect(handlers.onDone).toHaveBeenCalled();
        expect(handlers.onError).not.toHaveBeenCalled();
    });

    it('skipStep posts a skip request', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/steps/step1/skips', async ({ request }) => {
                const body = (await request.json()) as { reason: string };
                expect(body.reason).toBe('Too hard');
                return HttpResponse.json({
                    id: 'skip1',
                    stepId: 'step1',
                    status: 'PENDING',
                    reason: 'Too hard',
                    reviewComment: null,
                    createdAt: new Date().toISOString(),
                });
            }),
        );

        const step: OnboardingStepDetail = {
            id: 'step1',
            phaseId: 'phase1',
            position: 1,
            title: 'Step 1',
            description: '',
            type: 'TASK',
            estimatedMinutes: 10,
            expectedOutcomes: [],
            tasks: [],
            resources: [],
            status: 'IN_PROGRESS',
            startedAt: null,
            completedAt: null,
            feedback: null,
            skip: null,
        };

        const res = await onboardingService.skipStep(step, 'Too hard');
        expect(res.id).toBe('skip1');
    });

    it('updateTask updates finished state', async () => {
        let capturedBody: unknown = null;
        server.use(
            http.put('/api/v1/onboarding/me/tasks/task1', async ({ request }) => {
                capturedBody = await request.json();
                return new HttpResponse(null, { status: 200 });
            }),
        );

        const task: OnboardingTaskEndpoint = {
            id: 'task1',
            stepId: 'step1',
            position: 1,
            title: 'T1',
            description: 'D1',
            finished: false,
        };
        await onboardingService.updateTask(task, true);

        expect(capturedBody).toEqual({
            position: 1,
            title: 'T1',
            description: 'D1',
            finished: true,
        });
    });
});
