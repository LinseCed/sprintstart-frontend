import { describe, it, expect } from 'vitest';
import { firstName, formatDaysAgo, formatHours } from '../../../src/features/human-loop/format';

describe('human-loop format helpers', () => {
    it('formats hours as plain elapsed time', () => {
        expect(formatHours(0)).toBe('less than an hour');
        expect(formatHours(1)).toBe('1 hour');
        expect(formatHours(5)).toBe('5 hours');
        expect(formatHours(24)).toBe('1 day');
        expect(formatHours(72)).toBe('3 days');
    });

    it('formats day counts relative to now', () => {
        expect(formatDaysAgo(0)).toBe('today');
        expect(formatDaysAgo(1)).toBe('yesterday');
        expect(formatDaysAgo(3)).toBe('3 days ago');
    });

    it('takes the first token of a display name', () => {
        expect(firstName('Ada Lovelace')).toBe('Ada');
        expect(firstName('  Grace  Hopper ')).toBe('Grace');
        expect(firstName('Cher')).toBe('Cher');
    });
});
