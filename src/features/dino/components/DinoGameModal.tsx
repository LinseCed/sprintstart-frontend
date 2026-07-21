import { AnimatePresence, motion } from "framer-motion";
import { centralSpringToken } from "../../../styles/tokens";
import { DinoGame } from "../../chatbot/components/DinoGame";

/**
 * Props for {@link DinoGameModal}.
 */
interface DinoGameModalProps {
    /** When true, the modal is visible and the dino runner is mounted. */
    open: boolean;
    /**
     * Called when the user requests to close (overlay click, or via the
     * DinoGame's own Esc / exit button — DinoGame calls `onExit` on Escape
     * and on its in-game "Esc ✕" button, which we route here).
     */
    onClose: () => void;
}

/**
 * Dashboard easter-egg wrapper that mounts the existing {@link DinoGame}
 * runner inside a Framer Motion modal.
 *
 * Unlike {@link Game2048Modal}, this wrapper has no header bar and no
 * modal-level Escape listener: {@link DinoGame} already renders its own
 * score / "Esc ✕" overlay on top of the canvas and calls `onExit` on
 * Escape, so adding a second header or Esc handler would duplicate chrome
 * and double-fire on Esc. Bypasses the `dinoUnlocked` localStorage gate —
 * the dashboard chord is a true easter egg, always available.
 */
export function DinoGameModal({ open, onClose }: DinoGameModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-app-overlay p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={centralSpringToken}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Dino game"
                >
                    <motion.div
                        className="relative w-[680px] max-w-full overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-2xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={centralSpringToken}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DinoGame onExit={onClose} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
