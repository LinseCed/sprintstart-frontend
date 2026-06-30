# Frontend Premium Animation Tokens

This document details the Framer Motion animation architecture and centralized spring transition tokens utilized inside `sprintstart-frontend` to guarantee a fluid, high-fidelity user interface.

---

## 1. Centralized Spring Configurations

To prevent visual inconsistencies (such as different elements bouncing with varying speeds), we standardize on a set of transition presets.

These are defined as exportable constants and must be reused in all `motion` components:

```typescript
// Centralized spring constants
export const centralSpringToken = {
    type: "spring",
    stiffness: 300,
    damping: 25,
    mass: 0.8
};

export const hoverSpringToken = {
    type: "spring",
    stiffness: 400,
    damping: 15
};
```

---

## 2. Layout Transitions & List Deletions

When items (like steps or resources) are added or removed dynamically, standard CSS transitions cause adjacent elements to snap instantly to their new locations. We require **layout animations** to interpolate this reflow smoothly.

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { centralSpringToken } from "@/styles/tokens";

export function TaskList({ tasks, onDelete }) {
    return (
        <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
                {tasks.map(task => (
                    <motion.div
                        layout
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={centralSpringToken}
                    >
                        <TaskCard task={task} onDelete={onDelete} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
```

### Defensive Layout Rules
1. **`mode="popLayout"`**: Always specify `mode="popLayout"` on `<AnimatePresence>` when wrapping elements that affect document reflow. This pops the exiting element out of the layout flow, allowing surrounding elements to animate into their new positions immediately rather than waiting for the exit animation to complete.
2. **`layout` Attribute**: Ensure the direct child of `<AnimatePresence>` has the `layout` attribute set. This tells Framer Motion to watch the element's bounding box and animate size or position changes.
3. **Key Declarations**: The animated child must have a unique, stable `key`. Avoid index offsets; use database UUIDs.
