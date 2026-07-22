import { describe, it, expect } from 'vitest';
import { deriveSourceStatus } from '../../../../src/features/data-ingestion/data';

describe('deriveSourceStatus', () => {
    it('marks a disabled source as disabled regardless of run state', () => {
        const status = deriveSourceStatus({
            backendStatus: 'DISABLED',
            runStatus: 'RUNNING',
            hasErrors: false,
            hasNeverSynced: false,
        });
        expect(status.state).toBe('disabled');
        expect(status.label).toBe('Disabled');
        expect(status.spinning).toBe(false);
    });

    it('treats backend UPDATING/INDEXING as syncing', () => {
        expect(
            deriveSourceStatus({ backendStatus: 'UPDATING', hasErrors: false, hasNeverSynced: false }).state,
        ).toBe('syncing');
        expect(
            deriveSourceStatus({ backendStatus: 'INDEXING', hasErrors: false, hasNeverSynced: false }).state,
        ).toBe('syncing');
    });

    it('treats a running ingestion run as syncing', () => {
        const status = deriveSourceStatus({
            runStatus: 'RUNNING',
            hasErrors: false,
            hasNeverSynced: false,
        });
        expect(status.state).toBe('syncing');
        expect(status.spinning).toBe(true);
    });

    it('does not treat a stale pending AI index as syncing on its own', () => {
        // A finished run whose AI-index status never resolved must not read as busy.
        const status = deriveSourceStatus({
            aiSyncStatus: 'PENDING',
            hasErrors: false,
            hasNeverSynced: false,
        });
        expect(status.state).toBe('connected');
    });

    it('labels backend INDEXING as Indexing', () => {
        const status = deriveSourceStatus({
            backendStatus: 'INDEXING',
            hasErrors: false,
            hasNeverSynced: false,
        });
        expect(status.state).toBe('syncing');
        expect(status.label).toBe('Indexing');
    });

    it('flags a never-synced source as attention with a Not synced label', () => {
        const status = deriveSourceStatus({ hasErrors: false, hasNeverSynced: true });
        expect(status.state).toBe('attention');
        expect(status.label).toBe('Not synced');
    });

    it.each([
        { runStatus: 'FAILED' as const },
        { runStatus: 'PARTIAL' as const },
    ])('flags $runStatus runs as attention', ({ runStatus }) => {
        expect(
            deriveSourceStatus({ runStatus, hasErrors: false, hasNeverSynced: false }).state,
        ).toBe('attention');
    });

    it('flags out-of-date / failed backend states and errors as attention', () => {
        expect(
            deriveSourceStatus({ backendStatus: 'OUT_OF_DATE', hasErrors: false, hasNeverSynced: false }).state,
        ).toBe('attention');
        expect(
            deriveSourceStatus({ hasErrors: true, hasNeverSynced: false }).state,
        ).toBe('attention');
    });

    it('returns connected when everything is up to date', () => {
        const status = deriveSourceStatus({
            backendStatus: 'CONNECTED',
            runStatus: 'COMPLETED',
            aiSyncStatus: 'SUCCEEDED',
            hasErrors: false,
            hasNeverSynced: false,
        });
        expect(status.state).toBe('connected');
        expect(status.label).toBe('Connected');
    });
});
