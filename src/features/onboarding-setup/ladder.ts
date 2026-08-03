import type { AppRoute } from '../../auth/accessPolicy';
import type { DataSource } from '../data-ingestion/types';
import type { LadderRung, SetupLadder, SetupReadiness, SetupRung } from './types';

/**
 * Static metadata for each rung: its title, what the stage is for, and where "open" goes. Keyed by
 * the backend rung key (plus `corpus`, which is composed client-side). The order here is the order
 * the ladder renders — the setup pipeline, top to bottom.
 */
type RungMeta = {
    title: string;
    blurb: string;
    route: AppRoute;
    openLabel: string;
    reviewKind?: string;
};

/**
 * Titles are **states of the project, not instructions.** "Starter tasks stocked" is something that
 * is or is not true; "Stock starter tasks" would be a chore, and three of these four fill
 * themselves in from a crawl with nobody doing anything.
 */
const RUNG_META: Record<string, RungMeta> = {
    corpus: {
        title: 'Corpus connected',
        // The one rung where a person really is the thing standing in the way, and the blurb says
        // so rather than pretending the others are like it.
        blurb: 'The only thing here somebody has to do. Everything below is built from what gets ingested.',
        route: '/data-ingestion',
        openLabel: 'Open Data Ingestion',
    },
    // No `reviewKind`: there is no competency proposal queue to deep-link into. A competency is
    // authored (or corrected) in the studio directly, so the link goes to the thing itself.
    'skill-map': {
        title: 'Competencies to teach and measure against',
        blurb: 'The vocabulary the buddy names a gap in and a module hangs from. Generated when a crawl finishes; correct one by hand any time.',
        route: '/graph-studio',
        openLabel: 'Open the studio',
    },
    'starter-tasks': {
        title: 'Starter tasks stocked',
        blurb: 'Well-scoped first tasks a hire can aim at. Mined from the corpus and claimable straight away — looking one over only lifts its ranking demotion.',
        route: '/starter-work',
        openLabel: 'Open starter work',
        reviewKind: 'starter-tasks',
    },
    // The only rung whose route is this page: the role-track table sits directly beneath the
    // ladder, so acting on it is scrolling down rather than navigating away.
    tracks: {
        title: 'Roles say which track they onboard on',
        blurb: 'A role with no track onboards its people in the default wording. Set one per role so a hire’s work is named the way their own role names it.',
        route: '/setup',
        openLabel: 'See the roles below',
    },
};

/** The order rungs render in, matching the setup pipeline. */
const RUNG_ORDER = ['corpus', 'skill-map', 'starter-tasks', 'tracks'];

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
