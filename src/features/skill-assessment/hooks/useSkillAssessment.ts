import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/useAuth';
import { assessmentService, hasCompletedAssessment, markAssessmentCompleted } from '../../../services/assessmentService';
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
 * The interview itself is a one-time, **global** placement (it writes the global
 * competency ledger); `projectId` only scopes the path *preview* shown once it
 * finishes -- onboarding paths are per-project. When no project is selected
 * (e.g. a hire not yet in any project), the preview is skipped rather than
 * fetched, since there is no project to project a path against.
 *
 * Failed calls are tracked via `pendingAction` (not derived from `phase`/`path`)
 * so `retry()` re-runs exactly the call that failed -- e.g. a failed path fetch
 * after a successful final answer retries the fetch, not the answer submission.
 *
 * @param projectId The project whose path to preview after placement, or
 *   `undefined`/empty when none is selected.
 */
export function useSkillAssessment(projectId: string | undefined) {
    const { profile, status } = useAuth();
    const profileId = profile?.id;
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
        // Placement is done; without a selected project there's no per-project path
        // to preview, so just leave the chat with nothing more to show.
        if (!projectId) {
            setPhase('path');
            return;
        }
        try {
            const view = await assessmentService.fetchPath(projectId);
            setPath(view);
            setPhase('path');
        } catch (err) {
            setError(toMessage(err, 'Could not load your path.'));
        }
    }, [projectId]);

    const sendAnswer = useCallback(
        async (currentSessionId: string, answer: string) => {
            pendingActionRef.current = 'answer';
            setError(null);
            setIsThinking(true);
            try {
                const response = await assessmentService.answerAssessment(currentSessionId, answer);
                if (response.done) {
                    if (profileId) markAssessmentCompleted(profileId);
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
        [loadPath, profileId]
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
        // Wait for the profile to resolve so a completed-assessment check isn't skipped on a
        // still-loading profileId, which would restart the interview every refresh.
        if (status === 'loading') return;

        void (async () => {
            if (profileId && hasCompletedAssessment(profileId)) {
                await loadPath();
            } else {
                await start();
            }
        })();
        // `start`/`loadPath` are stable (empty/loadPath-only deps) so it's safe to omit them here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, profileId]);

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
