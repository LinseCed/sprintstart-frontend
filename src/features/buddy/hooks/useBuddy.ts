import { useCallback, useEffect, useState } from "react";
import { onOpenAiBuddy } from "../aiBuddyBus";
import { useBuddyConversation } from "./useBuddyConversation";

/**
 * Drives the floating buddy widget: the shared conversation core ([useBuddyConversation])
 * plus the widget's own open/closed state. History is loaded lazily the first time the
 * panel opens, so an unopened widget makes no request. Other surfaces can open the widget
 * and seed a draft via the aiBuddyBus (e.g. "Draft with AI" on the human-buddy card).
 */
export function useBuddy() {
    const conversation = useBuddyConversation();
    const { loadHistory, setDraft } = conversation;

    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    useEffect(() => {
        if (isOpen) void loadHistory();
    }, [isOpen, loadHistory]);

    useEffect(() => {
        /**
         * Lets other surfaces (e.g. the human buddy card) open the AI buddy and hand it
         * a draft to help the hire word their question.
         */
        return onOpenAiBuddy(({ draft: seed }) => {
            setIsOpen(true);
            if (seed) setDraft(seed);
        });
    }, [setDraft]);

    return {
        ...conversation,
        isOpen,
        toggleOpen,
    };
}
