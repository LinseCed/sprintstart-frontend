import type { AppRoute } from '../../auth/accessPolicy';
import type { DataSource } from '../data-ingestion/types';
import type { LadderRung, SetupLadder, SetupReadiness, SetupRung } from './types';

/**
 * Static metadata for each rung: its title, what the stage is for, and where "open" goes. Keyed by
 * the backend rung key (plus `corpus`, which is composed client-side). The order here is the order
 * the ladder renders — the setup pipeline, top to bottom.
 */
type RungMeta = { title: string; blurb: string; route: AppRoute; reviewKind?: string };

const RUNG_META: Record<string, RungMeta> = {
    corpus: {
        title: 'Corpus connected',
        blurb: 'The AI grounds answers, orientation and mined tasks in what has been ingested.',
        route: '/data-ingestion',
    },
    'skill-map': {
        title: 'Skill map approved',
        blurb: 'Generate a competency map from the corpus, then approve it. This is the substrate matching and gap-detection run on.',
        route: '/graph-studio',
        reviewKind: 'skill-map',
    },
    baseline: {
        title: 'Baseline set',
        blurb: 'Mark which approved competencies a hire on this project is expected to reach.',
        route: '/onboarding-baseline',
        reviewKind: 'baseline',
    },
    'starter-tasks': {
        title: 'Starter tasks stocked',
        blurb: 'Well-scoped first tasks a hire can aim at. Approving one turns it into a goal.',
        route: '/starter-work',
        reviewKind: 'starter-tasks',
    },
};

/** The order rungs render in, matching the setup pipeline. */
const RUNG_ORDER = ['corpus', 'skill-map', 'baseline', 'starter-tasks'];

/**
 * Derives the corpus rung from the ingestion sources the Data Ingestion page already builds, so the
 * two surfaces can never disagree about corpus health. Corpus lives in the ingestion module and has
 * no place in the onboarding readiness endpoint, so it is composed here instead.
 */
export function deriveCorpusRung(sources: DataSource[]): SetupRung {
    const ingested = sources.reduce((total, source) => total + source.latestIngestedCount, 0);
    const anyConnected = sources.some((source) => source.status === 'connected');
    const anyRunning = sources.some((source) => source.status === 'running');

    if (anyConnected) {
        return {
            key: 'corpus',
            state: 'OK',
            count: ingested,
            detail: `${ingested} artifact${ingested === 1 ? '' : 's'} ingested.`,
        };
    }
    if (anyRunning) {
        return {
            key: 'corpus',
            state: 'WARN',
            count: ingested,
            detail: 'First sync is still running.',
        };
    }
    return {
        key: 'corpus',
        state: 'WARN',
        count: 0,
        detail:
            sources.length === 0
                ? 'No sources connected yet. Connect a repository in Data Ingestion.'
                : 'No corpus ingested yet. Check the source in Data Ingestion.',
    };
}

/**
 * Merges the corpus rung with the backend's three rungs into the full ordered ladder, attaching the
 * display metadata each rung renders with. Overall readiness is every rung being OK — the corpus
 * included, which the backend cannot see.
 */
export function buildLadder(readiness: SetupReadiness, corpus: SetupRung): SetupLadder {
    const byKey = new Map<string, SetupRung>();
    byKey.set(corpus.key, corpus);
    for (const rung of readiness.rungs) {
        byKey.set(rung.key, rung);
    }

    const rungs: LadderRung[] = RUNG_ORDER.flatMap((key) => {
        const rung = byKey.get(key);
        const meta = RUNG_META[key];
        if (!rung || !meta) {
            return [];
        }
        return [{ ...rung, ...meta }];
    });

    return { rungs, ready: rungs.every((rung) => rung.state === 'OK') };
}
