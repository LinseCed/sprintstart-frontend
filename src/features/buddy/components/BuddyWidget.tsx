import { motion } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { useBuddy } from '../hooks/useBuddy';
import { BuddyPanel } from './BuddyPanel';

/**
 * The always-on, repo-grounded onboarding companion. Mounted once at the app
 * root (see App.tsx) so it survives page navigation and keeps its open/closed
 * state for the lifetime of the session.
 */
export function BuddyWidget() {
    const {
        messages,
        isThinking,
        isOpen,
        toggleOpen,
        draft,
        setDraft,
        handleSubmit,
        confirmAction,
        dismissAction,
        bottomRef,
    } = useBuddy();

    return (
        <>
            {isOpen && (
                <BuddyPanel
                    messages={messages}
                    isThinking={isThinking}
                    draft={draft}
                    setDraft={setDraft}
                    handleSubmit={handleSubmit}
                    confirmAction={confirmAction}
                    dismissAction={dismissAction}
                    bottomRef={bottomRef}
                    onClose={toggleOpen}
                />
            )}

            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleOpen}
                className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-app-brand text-white shadow-lg shadow-app-brand/25 transition-colors hover:bg-app-brand-hover focus:outline-none focus:ring-2 focus:ring-app-brand focus:ring-offset-2 focus:ring-offset-app-bg"
                aria-label={isOpen ? 'Close buddy chat' : 'Open buddy chat'}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </motion.button>
        </>
    );
}
