import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Compass, FileQuestion, Footprints, HelpCircle, Library, ListChecks } from 'lucide-react';
import type { ModulePage } from '../types';
import { isKnownPageKind } from '../types';

type ModulePageViewProps = {
    page: ModulePage;
};

function Markdown({ body }: { body: string }) {
    return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </div>
    );
}

/**
 * A framed page: a short banner saying what kind of reading this is, then the body.
 *
 * The frame exists because the kinds are doing different work. A walkthrough of
 * real code is not shaped like an explanation, and a hire who cannot tell which
 * one they are reading reads both as prose to skim.
 */
function Framed({
    icon: Icon,
    label,
    hint,
    tone,
    page
}: {
    icon: typeof Compass;
    label: string;
    hint: string;
    tone: string;
    page: ModulePage;
}) {
    return (
        <section className="space-y-4">
            <div className={`flex items-start gap-2.5 rounded-xl border p-3 ${tone}`}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-xs opacity-90">{hint}</p>
                </div>
            </div>
            <h2 className="text-lg font-semibold text-app-text">{page.title}</h2>
            {page.body ? (
                <Markdown body={page.body} />
            ) : (
                <p className="text-sm text-app-text-muted">This page is empty.</p>
            )}
        </section>
    );
}

/**
 * Renders one module page according to its kind.
 *
 * Every known kind gets a deliberate treatment, and an **unknown** kind falls back
 * to a visibly-labelled rendering of its body rather than to nothing. A blank page
 * in the middle of a module a hire is graded on is worse than an unfamiliar label:
 * they cannot tell whether they missed something or the content is missing.
 *
 * `VERIFY` is not handled here -- the graded check is a live surface (input,
 * grading, attempts) that the module page owns, not a body to render.
 */
export function ModulePageView({ page }: ModulePageViewProps) {
    switch (page.kind) {
        case 'CONTEXT':
            return (
                <Framed
                    icon={Compass}
                    label="Why this matters"
                    hint="The reasoning behind how this team does it."
                    tone="border-app-brand-border bg-app-brand-soft text-app-brand-text"
                    page={page}
                />
            );

        case 'WALKTHROUGH':
            return (
                <Framed
                    icon={Footprints}
                    label="Walkthrough"
                    hint="One real example, traced end to end. Follow along in the code."
                    tone="border-app-border bg-app-surface-muted text-app-text-muted"
                    page={page}
                />
            );

        case 'RESOURCE':
            return (
                <Framed
                    icon={Library}
                    label="Where to read more"
                    hint="The real material. Worth a bookmark."
                    tone="border-app-border bg-app-surface-muted text-app-text-muted"
                    page={page}
                />
            );

        case 'CHECK':
            return (
                <Framed
                    icon={HelpCircle}
                    label="Quick self-check"
                    hint="Not graded -- try it before the real check."
                    tone="border-app-warning-border bg-app-warning-bg text-app-warning-text"
                    page={page}
                />
            );

        case 'TASK':
            return (
                <Framed
                    icon={ListChecks}
                    label="Try it"
                    hint="Hands on. Nothing here is submitted or graded."
                    tone="border-app-border bg-app-surface-muted text-app-text-muted"
                    page={page}
                />
            );

        case 'LESSON':
            return (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-app-text">{page.title}</h2>
                    {page.body ? (
                        <Markdown body={page.body} />
                    ) : (
                        <p className="text-sm text-app-text-muted">This page is empty.</p>
                    )}
                </section>
            );

        default:
            // Not a kind this client knows. Say so plainly and show the body
            // anyway -- silently rendering nothing would hide content a hire is
            // about to be graded on.
            return (
                <section className="space-y-4" data-testid="unknown-page-kind">
                    <div className="flex items-start gap-2.5 rounded-xl border border-app-border bg-app-surface-muted p-3 text-app-text-muted">
                        <FileQuestion className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide">
                                {isKnownPageKind(page.kind) ? page.kind : 'Unrecognized page'}
                            </p>
                            <p className="mt-0.5 text-xs">
                                This app doesn&apos;t know how to lay this page out yet, so
                                here it is as written.
                            </p>
                        </div>
                    </div>
                    <h2 className="text-lg font-semibold text-app-text">{page.title}</h2>
                    {page.body ? (
                        <Markdown body={page.body} />
                    ) : (
                        <p className="text-sm text-app-text-muted">This page is empty.</p>
                    )}
                </section>
            );
    }
}
