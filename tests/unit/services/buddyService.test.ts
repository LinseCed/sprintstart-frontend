import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMessages, streamMessage } from '../../../src/services/buddyService';
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
    });
});
