import { useCallback, useEffect, useRef, useState } from 'react';
import { assessmentService } from '../../../services/assessmentService';
import type { AssessmentChatMessage, PathView } from '../types';

type Phase = 'chat' | 'path';
type PendingAction = 'start' | 'answer' | 'path';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

/**
 * Owns the skill-assessment interview's state machine: starts (or resumes) the
 * session on mount, drives the turn-based chat loop against the backend, and
 * transitions to the personalized path once the interviewer is done.
 *
 * Failed calls are tracked via `pendingAction` (not derived from `phase`/`path`)
 * so `retry()` re-runs exactly the call that failed -- e.g. a failed path fetch
 * after a successful final answer retries the fetch, not the answer submission.
 */
export function useSkillAssessment() {
    const [phase, setPhase] = useState<Phase>('chat');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<AssessmentChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [path, setPath] = useState<PathView | null>(null);

    const pendingActionRef = useRef<PendingAction>('start');
    const lastAnswerRef = useRef<string>('');

    const loadPath = useCallback(async () => {
        pendingActionRef.current = 'path';
        setError(null);
        try {
            const view = await assessmentService.fetchPath();
            setPath(view);
            setPhase('path');
        } catch (err) {
            setError(toMessage(err, 'Could not load your path.'));
        }
    }, []);

    const sendAnswer = useCallback(
        async (currentSessionId: string, answer: string) => {
            pendingActionRef.current = 'answer';
            setError(null);
            setIsThinking(true);
            try {
                const response = await assessmentService.answerAssessment(currentSessionId, answer);
                if (response.done) {
                    await loadPath();
                } else if (response.question) {
                    const question = response.question;
                    setMessages(prev => [
                        ...prev,
                        { id: `q-${prev.length}`, role: 'assistant', content: question }
                    ]);
                }
            } catch (err) {
                setError(toMessage(err, 'Could not submit your answer.'));
            } finally {
                setIsThinking(false);
            }
        },
        [loadPath]
    );

    const start = useCallback(async () => {
        pendingActionRef.current = 'start';
        setError(null);
        setIsThinking(true);
        try {
            const response = await assessmentService.startAssessment();
            setSessionId(response.sessionId);
            setMessages([{ id: 'q-0', role: 'assistant', content: response.question }]);
        } catch (err) {
            setError(toMessage(err, 'Could not start the assessment.'));
        } finally {
            setIsThinking(false);
        }
    }, []);

    useEffect(() => {
        void (async () => {
            await start();
        })();
        // Runs once on mount; `start` is stable (no deps) so this is safe to omit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submitAnswer = useCallback(
        (answer: string) => {
            if (!sessionId || !answer.trim()) return;

            lastAnswerRef.current = answer;
            setMessages(prev => [...prev, { id: `a-${prev.length}`, role: 'user', content: answer }]);
            void sendAnswer(sessionId, answer);
        },
        [sessionId, sendAnswer]
    );

    const retry = useCallback(() => {
        if (pendingActionRef.current === 'start') {
            void start();
        } else if (pendingActionRef.current === 'path') {
            void loadPath();
        } else if (sessionId) {
            void sendAnswer(sessionId, lastAnswerRef.current);
        }
    }, [sessionId, start, loadPath, sendAnswer]);

    return { phase, messages, isThinking, error, path, submitAnswer, retry };
}
