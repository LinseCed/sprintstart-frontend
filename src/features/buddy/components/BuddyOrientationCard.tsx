import { useCallback, useEffect, useState } from 'react';
import { OrientationPanel } from '../../orientation/components/OrientationPanel';
import { OrientationEditor } from '../../orientation/components/OrientationEditor';
import { useProjectSelection } from '../../projects/useProjectSelection';
import { orientationService } from '../../../services/orientationService';
import type { MyOrientation } from '../../orientation/types';

/**
 * The orientation packet as a rich card inside the buddy conversation, rendered once the hire
 * confirms the buddy's `open_orientation` proposal. This is what that action *opens* now that
 * First Week is retired: the packet shows up where the hire already is instead of sending them
 * to a page.
 *
 * The read is a plain fetch, not the streaming assembly: confirming the action is what made the
 * backend assemble and cache the packet, so it is already there to read. The hire's "fix this"
 * capability from the retired page survives here unchanged — correcting the packet in place pins
 * it as human-authored.
 */
export function BuddyOrientationCard() {
    const { selectedProjectId } = useProjectSelection();
    const [orientation, setOrientation] = useState<MyOrientation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const load = useCallback(
        async (signal?: { cancelled: boolean }) => {
            if (!selectedProjectId) {
                setOrientation(null);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const result = await orientationService.fetchMyOrientation(selectedProjectId);
                if (signal?.cancelled) return;
                setOrientation(result);
            } catch (err) {
                if (signal?.cancelled) return;
                setError(err instanceof Error ? err.message : 'Could not load your orientation.');
            } finally {
                if (!signal?.cancelled) setIsLoading(false);
            }
        },
        [selectedProjectId]
    );

    useEffect(() => {
        const signal = { cancelled: false };
        // Deferred so the first setState isn't synchronous in the effect body (React 19 lint).
        void (async () => {
            await load(signal);
        })();
        return () => {
            signal.cancelled = true;
        };
    }, [load]);

    return (
        <div className="min-w-0 self-stretch">
            <OrientationPanel
                orientation={orientation}
                isLoading={isLoading}
                error={error}
                onRetry={() => void load()}
                onEdit={selectedProjectId ? () => setIsEditing(true) : undefined}
            />

            {isEditing && selectedProjectId && orientation?.taskId && (
                <OrientationEditor
                    taskTitle={orientation.taskTitle ?? 'your task'}
                    taskUrl={orientation.taskUrl}
                    initial={orientation.packet}
                    onSave={async input => {
                        await orientationService.authorMyOrientation(selectedProjectId, input);
                        await load();
                        return true;
                    }}
                    onRevert={
                        orientation.packet
                            ? async () => {
                                  await orientationService.revertMyOrientation(selectedProjectId);
                                  await load();
                                  return true;
                              }
                            : undefined
                    }
                    onClose={() => setIsEditing(false)}
                />
            )}
        </div>
    );
}
