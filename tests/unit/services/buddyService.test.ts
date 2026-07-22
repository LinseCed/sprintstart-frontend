import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMessages, performAction, streamMessage } from '../../../src/services/buddyService';
import { http, HttpResponse } from 'msw';
import { mockKeycloakInstance, server } from '../../unit/setup/vitest.setup';

describe('buddyService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockKeycloakInstance.authenticated = true;
        mockKeycloakInstance.token = 'test-token';
        mockKeycloakInstance.updateToken.mockResolvedValue(true);
    });

    describe('getMessages', () => {
        it('returns the buddy conversation as a bare array', async () => {
            server.use(
                http.get('/api/v1/onboarding/me/buddy/messages', () =>
                    HttpResponse.json([
                        { role: 'USER', content: 'hi', createdAt: '2026-07-18T00:00:00.000Z' },
                        { role: 'ASSISTANT', content: 'hello!', createdAt: '2026-07-18T00:00:01.000Z' },
                    ]),
                ),
            );

            const result = await getMessages();
            expect(result).toHaveLength(2);
            expect(result[0].role).toBe('USER');
            expect(result[1].content).toBe('hello!');
        });
    });

    describe('streamMessage', () => {
        it('receives tokens and done signal', async () => {
            let capturedAuthHeader: string | null = null;
            let capturedBody: unknown = null;
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: {"type":"token","content":"hel"}\n\n'));
                    controller.enqueue(encoder.encode('data: {"type":"token","content":"lo"}\n\n'));
                    controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
                    controller.close();
                },
            });

            server.use(
                http.post('/api/v1/onboarding/me/buddy/messages', async ({ request }) => {
                    capturedAuthHeader = request.headers.get('Authorization');
                    capturedBody = await request.json();
                    return new HttpResponse(stream, {
                        headers: { 'Content-Type': 'text/event-stream' },
                    });
                }),
            );

            const onToken = vi.fn();
            const onDone = vi.fn();
            const onError = vi.fn();

            await streamMessage('hello', { onToken, onCitation: vi.fn(), onDone, onError });

            expect(mockKeycloakInstance.updateToken).toHaveBeenCalledWith(30);
            expect(capturedAuthHeader).toBe('Bearer test-token');
            expect(capturedBody).toEqual({ content: 'hello' });
            expect(onToken).toHaveBeenCalledTimes(2);
            expect(onToken).toHaveBeenNthCalledWith(1, 'hel');
            expect(onToken).toHaveBeenNthCalledWith(2, 'lo');
            expect(onDone).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();
        });

        it('calls login and skips streaming if token refresh fails', async () => {
            let messageSent = false;
            mockKeycloakInstance.updateToken.mockRejectedValueOnce(new Error('Refresh failed'));

            server.use(
                http.post('/api/v1/onboarding/me/buddy/messages', () => {
                    messageSent = true;
                    return new HttpResponse(null, { status: 200 });
                }),
            );

            await streamMessage('hello', {
                onToken: vi.fn(),
                onCitation: vi.fn(),
                onDone: vi.fn(),
            });

            expect(mockKeycloakInstance.login).toHaveBeenCalledOnce();
            expect(messageSent).toBe(false);
        });

        it('calls onError when response is not ok', async () => {
            server.use(
                http.post('/api/v1/onboarding/me/buddy/messages', () =>
                    new HttpResponse(null, { status: 500 }),
                ),
            );

            const onError = vi.fn();
            await streamMessage('hello', {
                onToken: vi.fn(),
                onCitation: vi.fn(),
                onDone: vi.fn(),
                onError,
            });

            expect(onError).toHaveBeenCalledWith('HTTP error! status: 500');
        });

        it('processes citation events', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(
                        encoder.encode(
                            'data: {"type":"citation","artifact_id":"a1","filename":"doc.txt","start_line":5}\n\n',
                        ),
                    );
                    controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
                    controller.close();
                },
            });

            server.use(
                http.post('/api/v1/onboarding/me/buddy/messages', () =>
                    new HttpResponse(stream, {
                        headers: { 'Content-Type': 'text/event-stream' },
                    }),
                ),
            );

            const onCitation = vi.fn();
            const onDone = vi.fn();

            await streamMessage('hello', {
                onToken: vi.fn(),
                onCitation,
                onDone,
            });

            expect(onCitation).toHaveBeenCalledWith({
                artifactId: 'a1',
                filename: 'doc.txt',
                sourceUrl: undefined,
                startLine: 5,
                startPage: undefined,
            });
            expect(onDone).toHaveBeenCalledTimes(1);
        });

        it('handles stream error event', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: {"type":"error","message":"Model overload"}\n\n'));
                    controller.close();
                },
            });

            server.use(
                http.post('/api/v1/onboarding/me/buddy/messages', () =>
                    new HttpResponse(stream, {
                        headers: { 'Content-Type': 'text/event-stream' },
                    }),
                ),
            );

            const onError = vi.fn();
            await streamMessage('hello', {
                onToken: vi.fn(),
                onCitation: vi.fn(),
                onDone: vi.fn(),
                onError,
            });

            expect(onError).toHaveBeenCalledWith('Model overload');
        });

        it('surfaces an action proposal without mutating anything', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(
                        encoder.encode(
                            'data: {"type":"action_proposal","action":"claim_task_zero","label":"Start Task 0"}\n\n',
                        ),
                    );
                    controller.enqueue(encoder.encode('data: {"type":"token","content":"Confirm below."}\n\n'));
                    controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
                    controller.close();
                },
            });

            server.use(
                http.post('/api/v1/onboarding/me/buddy/messages', () =>
                    new HttpResponse(stream, {
                        headers: { 'Content-Type': 'text/event-stream' },
                    }),
                ),
            );

            const onActionProposal = vi.fn();
            await streamMessage('help me start my first task', {
                onToken: vi.fn(),
                onCitation: vi.fn(),
                onDone: vi.fn(),
                onActionProposal,
            });

            expect(onActionProposal).toHaveBeenCalledWith({
                action: 'claim_task_zero',
                label: 'Start Task 0',
                question: undefined,
                taskId: undefined,
                moduleId: undefined,
                answer: undefined,
            });
        });

        it('maps a proposal\'s snake_case confirm payloads to camelCase', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(
                        encoder.encode(
                            'data: {"type":"action_proposal","action":"claim_goal","label":"Claim this task","task_id":"t-1"}\n\n',
                        ),
                    );
                    controller.enqueue(
                        encoder.encode(
                            'data: {"type":"action_proposal","action":"submit_verification","label":"Submit answer","module_id":"m-1","answer":"42"}\n\n',
                        ),
                    );
                    controller.enqueue(encoder.encode('data: {"type":"done"}\n\n'));
                    controller.close();
                },
            });

            server.use(
                http.post('/api/v1/onboarding/me/buddy/messages', () =>
                    new HttpResponse(stream, {
                        headers: { 'Content-Type': 'text/event-stream' },
                    }),
                ),
            );

            const onActionProposal = vi.fn();
            await streamMessage('let me try that', {
                onToken: vi.fn(),
                onCitation: vi.fn(),
                onDone: vi.fn(),
                onActionProposal,
            });

            expect(onActionProposal).toHaveBeenNthCalledWith(1, {
                action: 'claim_goal',
                label: 'Claim this task',
                question: undefined,
                taskId: 't-1',
                moduleId: undefined,
                answer: undefined,
            });
            expect(onActionProposal).toHaveBeenNthCalledWith(2, {
                action: 'submit_verification',
                label: 'Submit answer',
                question: undefined,
                taskId: undefined,
                moduleId: 'm-1',
                answer: '42',
            });
        });
    });

    describe('performAction', () => {
        it('confirms an action and returns the outcome', async () => {
            let capturedBody: unknown = null;
            server.use(
                http.post('/api/v1/onboarding/me/buddy/actions', async ({ request }) => {
                    capturedBody = await request.json();
                    return HttpResponse.json({ ok: true, message: 'Task 0 is yours.' });
                }),
            );

            const result = await performAction('claim_task_zero');

            expect(result).toEqual({ ok: true, message: 'Task 0 is yours.' });
            expect(capturedBody).toMatchObject({ action: 'claim_task_zero' });
        });

        it('sends the composed question for a flag-to-PM confirmation', async () => {
            let capturedBody: { action?: string; question?: string } = {};
            server.use(
                http.post('/api/v1/onboarding/me/buddy/actions', async ({ request }) => {
                    capturedBody = (await request.json()) as { action?: string; question?: string };
                    return HttpResponse.json({ ok: true, message: 'Flagged to your PM.' });
                }),
            );

            await performAction('flag_to_pm', { question: 'How do we deploy?' });

            expect(capturedBody.action).toBe('flag_to_pm');
            expect(capturedBody.question).toBe('How do we deploy?');
        });

        it('echoes the goal-claim and verification payloads the proposal carried', async () => {
            let capturedBody: Record<string, unknown> = {};
            server.use(
                http.post('/api/v1/onboarding/me/buddy/actions', async ({ request }) => {
                    capturedBody = (await request.json()) as Record<string, unknown>;
                    return HttpResponse.json({ ok: true, message: 'Done.' });
                }),
            );

            await performAction('claim_goal', { taskId: 't-1' });
            expect(capturedBody).toMatchObject({ action: 'claim_goal', taskId: 't-1' });

            await performAction('submit_verification', { moduleId: 'm-1', answer: '42' });
            expect(capturedBody).toMatchObject({
                action: 'submit_verification',
                moduleId: 'm-1',
                answer: '42',
            });
        });
    });
});
