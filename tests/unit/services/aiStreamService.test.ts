import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { streamAiProgress } from '../../../src/services/aiStreamService';
import { mockKeycloakInstance, server } from '../../unit/setup/vitest.setup';

const ENDPOINT = '/api/v1/onboarding/me/orientation/stream?projectId=p1';

function sseStream(...payloads: string[]): ReadableStream {
    const encoder = new TextEncoder();
    return new ReadableStream({
        start(controller) {
            for (const payload of payloads) {
                controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
            controller.close();
        }
    });
}

describe('streamAiProgress', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockKeycloakInstance.authenticated = true;
        mockKeycloakInstance.token = 'test-token';
        mockKeycloakInstance.updateToken.mockResolvedValue(true);
    });

    it('dispatches each progress event, then done, with a bearer token', async () => {
        let authHeader: string | null = null;
        server.use(
            http.post('/api/v1/onboarding/me/orientation/stream', ({ request }) => {
                authHeader = request.headers.get('Authorization');
                return new HttpResponse(
                    sseStream(
                        '{"type":"stage","stage":"retrieving","label":"Searching"}',
                        '{"type":"item","label":"setting up: Run it"}',
                        '{"type":"done","label":"Orientation ready"}'
                    ),
                    { headers: { 'Content-Type': 'text/event-stream' } }
                );
            })
        );

        const onEvent = vi.fn();
        const onDone = vi.fn();
        const onError = vi.fn();
        await streamAiProgress(ENDPOINT, { onEvent, onDone, onError });

        expect(authHeader).toBe('Bearer test-token');
        // Only the progress events flow through onEvent; done has its own callback.
        expect(onEvent).toHaveBeenCalledTimes(2);
        expect(onEvent.mock.calls[0][0]).toMatchObject({ type: 'stage', stage: 'retrieving' });
        expect(onEvent.mock.calls[1][0]).toMatchObject({ type: 'item' });
        expect(onDone).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });

    it('reports a terminal error event through onError', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/orientation/stream', () =>
                new HttpResponse(sseStream('{"type":"error","message":"AI is down"}'), {
                    headers: { 'Content-Type': 'text/event-stream' }
                })
            )
        );

        const onDone = vi.fn();
        const onError = vi.fn();
        await streamAiProgress(ENDPOINT, { onEvent: vi.fn(), onDone, onError });

        expect(onError).toHaveBeenCalledWith('AI is down');
        expect(onDone).not.toHaveBeenCalled();
    });

    it('calls onError when the response is not ok', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/orientation/stream', () =>
                new HttpResponse(null, { status: 500 })
            )
        );

        const onError = vi.fn();
        await streamAiProgress(ENDPOINT, { onEvent: vi.fn(), onDone: vi.fn(), onError });

        expect(onError).toHaveBeenCalledWith('HTTP error! status: 500');
    });

    it('treats a stream that closes without a terminal event as done', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/orientation/stream', () =>
                new HttpResponse(sseStream('{"type":"stage","label":"Searching"}'), {
                    headers: { 'Content-Type': 'text/event-stream' }
                })
            )
        );

        const onDone = vi.fn();
        await streamAiProgress(ENDPOINT, { onEvent: vi.fn(), onDone, onError: vi.fn() });

        expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('skips a malformed chunk rather than failing the stream', async () => {
        server.use(
            http.post('/api/v1/onboarding/me/orientation/stream', () =>
                new HttpResponse(sseStream('not json', '{"type":"done","label":"ok"}'), {
                    headers: { 'Content-Type': 'text/event-stream' }
                })
            )
        );

        const onEvent = vi.fn();
        const onDone = vi.fn();
        const onError = vi.fn();
        await streamAiProgress(ENDPOINT, { onEvent, onDone, onError });

        // The garbage line is skipped; the good `done` still lands.
        expect(onEvent).not.toHaveBeenCalled();
        expect(onDone).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });
});
