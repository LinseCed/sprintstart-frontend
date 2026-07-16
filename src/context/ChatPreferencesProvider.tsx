import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ChatPreferencesContext } from './ChatPreferencesContext';

const STORAGE_KEY = 'chatPreferences.showThoughtProcess';

/**
 * Reads the stored Thought Process preference, defaulting to `true` (shown)
 * when nothing has been persisted yet — matching the pre-existing behaviour.
 */
function getInitialShowThoughtProcess(): boolean {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return true;
}

/**
 * Provider for client-side chat display preferences. Currently exposes the
 * "Show Thought Process" toggle, persisted to localStorage so the choice
 * survives reloads. The reasoning data itself is always collected on the
 * message; this only controls whether it is rendered.
 */
export function ChatPreferencesProvider({ children }: { children: ReactNode }) {
    const [showThoughtProcess, setShowThoughtProcessState] = useState<boolean>(
        () => getInitialShowThoughtProcess(),
    );

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, String(showThoughtProcess));
    }, [showThoughtProcess]);

    const setShowThoughtProcess = (value: boolean) => {
        setShowThoughtProcessState(value);
    };

    return (
        <ChatPreferencesContext.Provider value={{ showThoughtProcess, setShowThoughtProcess }}>
            {children}
        </ChatPreferencesContext.Provider>
    );
}
