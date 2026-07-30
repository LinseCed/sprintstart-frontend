import type { Transition } from "framer-motion";

/**
 * Centralized Framer Motion spring transition presets.
 *
 * Use these for ALL `motion` components so the whole app shares one
 * "velocity" — elements bounce and settle at the same speed/stiffness.
 * Documented in `docs/animation_tokens.md`; implemented here as the single
 * source of truth.
 *
 * Usage:
 * ```tsx
 * import { centralSpringToken } from "@/styles/tokens";
 * <motion.div transition={centralSpringToken} ... />
 * ```
 */

/**
 * Default spring for layout transitions, list enter/exit, and general motion.
 * Snappy but not stiff — settles quickly without overshooting violently.
 */
export const centralSpringToken: Transition = {
    type: "spring",
    stiffness: 300,
    damping: 25,
    mass: 0.8,
};

/**
 * Lighter spring for hover/tap micro-interactions — faster, slightly bouncier.
 */
export const hoverSpringToken: Transition = {
    type: "spring",
    stiffness: 400,
    damping: 15,
};
