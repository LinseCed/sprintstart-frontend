import { useCallback, useEffect, useRef, useState } from 'react';
import { assessmentService } from '../../../services/assessmentService';
import type { BuddyMessageView } from '../types';

/** Which buddy the hire gets: still deciding, the calibrating interview, or the mentor. */
export type BuddyIntakeMode = 'loading' | 'intake' | 'mentor';

type PendingAction = 'start' | 'answer';

function toMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function buddyMessage(role: BuddyMessageView['role'], content: string): BuddyMessageView {
    return { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() };
}

/**
 * Drives the buddy's intake mode: whether this hire still needs the placement
 * interview, and the interview itself when they do.
 *
 * The placement interview **is** the buddy's first conversation — it runs against
 * the existing assessment engine (unchanged), but its turns render in the buddy
 * thread and the hire answers in the buddy composer, so there is no second chat
 * surface to be handed to. The status read is the backend's (`GET
 * /me/assessment/status`), not a client-side flag: placement is a server fact.
 *
 * The engine and endpoints stay; this hook is only the host. On `done` the
 * placement is already written server-side, and the mode flips to `mentor` —
 * the buddy continues with the ledger it just wrote visible through its tools.
 *
 * Failed calls are tracked via `pendingAction` so [retry] re-runs exactly the
 * call that failed: a failed start re-runs the status check, a failed answer
 * re-sends the last answer (never duplicating the user's own bubble).
 */
export function useBuddyIntake() {
    const [mode, setMode] = useState<BuddyIntakeMode>('loading');
    const [messages, setMessages] = useState<BuddyMessageView[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState('');

    const sessionIdRef = useRef<string | null>(null);
    const pendingActionRef = useRef<PendingAction>('start');
    const lastAnswerRef = useRef('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const begin = useCallback(async () => {
        pendingActionRef.current = 'start';
        setError(null);
        setIsThinking(true);
        try {
            const status = await assessmentService.fetchAssessmentStatus();
            if (status.completed) {
                setMode('mentor');
                return;
            }
            // Start resumes an in-progress session server-side, so a refresh
            // mid-interview lands on the current question, not a new session.
            const response = await assessmentService.startAssessment();
            sessionIdRef.current = response.sessionId;
            setMessages([buddyMessage('ASSISTANT', response.question)]);
            setMode('intake');
        } catch (err) {
            setError(toMessage(err, 'Could not start the assessment.'));
        } finally {
            setIsThinking(false);
        }
    }, []);

    useEffect(() => {
        // Deferred through a microtask so the first setState isn't synchronous in
        // the effect body (React 19 cascading-render guard).
        void (async () => {
            await begin();
        })();
    }, [begin]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendAnswer = useCallback(async (answer: string) => {
        const sessionId = sessionIdRef.current;
        if (!sessionId) return;
        pendingActionRef.current = 'answer';
        lastAnswerRef.current = answer;
        setError(null);
        setIsThinking(true);
        try {
            const response = await assessmentService.answerAssessment(sessionId, answer);
            if (response.done) {
                setMode('mentor');
            } else if (response.question) {
                setMessages(prev => [...prev, buddyMessage('ASSISTANT', response.question ?? '')]);
            }
        } catch (err) {
            setError(toMessage(err, 'Could not submit your answer.'));
        } finally {
            setIsThinking(false);
        }
    }, []);

    const handleSubmit = useCallback(
        (event: React.FormEvent) => {
            event.preventDefault();
            const text = draft.trim();
            if (!text || isThinking) return;

            setMessages(prev => [...prev, buddyMessage('USER', text)]);
            setDraft('');
            void sendAnswer(text);
        },
        [draft, isThinking, sendAnswer]
    );

    const retry = useCallback(() => {
        if (pendingActionRef.current === 'answer') {
            void sendAnswer(lastAnswerRef.current);
        } else {
            void begin();
        }
    }, [begin, sendAnswer]);

    return { mode, messages, isThinking, error, draft, setDraft, handleSubmit, retry, bottomRef };
}
