import { useEffect, useReducer } from 'react';
import { Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Artifact, ArtifactContent } from '../types';
import { knowledgeService } from '../../../services/knowledgeService';
import { SidePanel } from '../../../components/ui/SidePanel';

/**
 * Props for the ArtifactViewerDrawer component.
 */
interface ArtifactViewerDrawerProps {
    artifact: Artifact | null;
    /** Closes the drawer and clears the selected artifact in the parent. */
    onClose: () => void;
    /** Project scope required to fetch the artifact content and summary stream. */
    projectId: string;
}

type ViewMode = 'raw' | 'summary';

interface DrawerState {
    viewMode: ViewMode;
    content: ArtifactContent | null;
    summary: string;
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
}

type DrawerAction =
    | { type: 'reset' }
    | { type: 'loadStart' }
    | { type: 'loadSuccess'; content: ArtifactContent }
    | { type: 'loadError'; error: string }
    | { type: 'summarizeStart' }
    | { type: 'summarizeToken'; token: string }
    | { type: 'summarizeDone' }
    | { type: 'summarizeError'; error: string }
    | { type: 'showRaw' };

const initialState: DrawerState = {
    viewMode: 'raw',
    content: null,
    summary: '',
    isLoading: false,
    isStreaming: false,
    error: null,
};

function drawerReducer(state: DrawerState, action: DrawerAction): DrawerState {
    switch (action.type) {
        case 'reset':
            return { ...initialState, isLoading: true };
        case 'loadStart':
            return { ...state, isLoading: true, error: null };
        case 'loadSuccess':
            return { ...state, isLoading: false, content: action.content };
        case 'loadError':
            return { ...state, isLoading: false, error: action.error };
        case 'summarizeStart':
            return { ...state, viewMode: 'summary', summary: '', isStreaming: true, error: null };
        case 'summarizeToken':
            return { ...state, summary: state.summary + action.token };
        case 'summarizeDone':
            return { ...state, isStreaming: false };
        case 'summarizeError':
            return { ...state, isStreaming: false, error: action.error };
        case 'showRaw':
            return { ...state, viewMode: 'raw' };
        default:
            return state;
    }
}

/** ISSUE and PULL_REQUEST artifacts are always rendered as Markdown regardless of mime, since the backend normalizes their bodies to Markdown. */
const shouldRenderAsMarkdown = (content: ArtifactContent, artifact: Artifact | null): boolean =>
    content.mimeType.startsWith('text/markdown')
    || artifact?.artifactType === 'ISSUE'
    || artifact?.artifactType === 'PULL_REQUEST';

/**
 * ArtifactViewerDrawer
 *
 * Slide-out panel that displays the raw content of a selected artifact.
 * Allows users to trigger an AI summarization of the content to quickly extract key information
 * without reading massive files or issues.
 */
export function ArtifactViewerDrawer({ artifact, onClose, projectId }: ArtifactViewerDrawerProps) {
    const [state, dispatch] = useReducer(drawerReducer, initialState);

    /**
     * Loads the raw artifact content from the backend whenever a new artifact is selected.
     * Required to properly render the markdown or raw text in the drawer.
     */
    useEffect(() => {
        if (!artifact) return;

        let isMounted = true;
        dispatch({ type: 'reset' });

        knowledgeService.getArtifactContent(projectId, artifact.id, artifact.sourceSystem)
            .then(data => {
                if (isMounted) dispatch({ type: 'loadSuccess', content: data });
            })
            .catch(err => {
                if (isMounted) dispatch({ type: 'loadError', error: err instanceof Error ? err.message : String(err) });
            });

        return () => {
            isMounted = false;
        };
    }, [artifact, projectId]);

    /**
     * Triggers the AI summarization process for the currently loaded artifact.
     * Connects to the backend SSE stream to display the summary progressively.
     */
    const handleSummarize = async () => {
        if (!artifact) return;

        dispatch({ type: 'summarizeStart' });

        try {
            await knowledgeService.summarizeArtifact(projectId, artifact.id, {
                onToken: (token) => dispatch({ type: 'summarizeToken', token }),
                onDone: () => dispatch({ type: 'summarizeDone' }),
                onError: (err) => dispatch({ type: 'summarizeError', error: err.message }),
            });
        } catch (err) {
            dispatch({ type: 'summarizeError', error: err instanceof Error ? err.message : 'Failed to summarize' });
        }
    };

    const { viewMode, content, summary, isLoading, isStreaming, error } = state;

    const titleContent = viewMode === 'summary' ? (
        <button
            onClick={() => dispatch({ type: 'showRaw' })}
            className="p-1.5 hover:bg-app-surface border border-transparent hover:border-app-border rounded-md transition-colors flex items-center gap-1 text-sm font-medium text-app-text-muted"
            data-testid="back-to-file-btn"
        >
            <ArrowLeft className="w-4 h-4" />
            Back to File
        </button>
    ) : (
        <div className="font-semibold text-lg text-app-text line-clamp-1">{artifact?.title}</div>
    );

    const actionsContent = viewMode === 'raw' && (
        <button
            onClick={() => void handleSummarize()}
            data-testid="summarise-btn"
            className="flex items-center gap-2 px-3 py-1.5 bg-app-brand text-white rounded-md text-sm font-medium hover:bg-app-brand/90 transition-colors shadow-sm"
        >
            <Sparkles className="w-4 h-4" />
            Summarise
        </button>
    );

    return (
        <SidePanel
            isOpen={!!artifact}
            onClose={onClose}
            title={titleContent}
            actions={actionsContent}
            widthClassName="w-full max-w-[720px] md:w-[60%] lg:w-[70%]"
            zIndexClassName="z-50 md:z-30"
            panelClassName="border-l border-app-border shadow-2xl"
            panelBackgroundClassName="bg-app-surface"
            headerClassName="p-4 bg-app-bg"
            contentClassName="p-6"
        >
            {error ? (
                <div className="p-4 bg-app-danger-bg text-app-danger-text rounded-lg border border-app-danger-border">
                    <p className="font-medium">Error loading content</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            ) : viewMode === 'raw' ? (
                <div data-testid="raw-content">
                    {isLoading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-app-border rounded w-3/4"></div>
                            <div className="h-4 bg-app-border rounded w-1/2"></div>
                            <div className="h-4 bg-app-border rounded w-5/6"></div>
                            <div className="h-4 bg-app-border rounded w-2/3"></div>
                        </div>
                    ) : (
                        content && shouldRenderAsMarkdown(content, artifact) ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {content.content}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <pre className="font-mono text-sm text-app-text bg-app-bg p-4 rounded-lg overflow-x-auto whitespace-pre-wrap border border-app-border">
                                {content?.content}
                            </pre>
                        )
                    )}
                </div>
            ) : (
                <div data-testid="summary-content" className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="flex items-center gap-2 mb-6 text-app-brand font-medium border-b border-app-border pb-4">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-lg">AI Summary</span>
                    </div>

                    {!summary && isStreaming ? (
                        <div className="flex items-center gap-3 text-app-text-muted py-8 justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-app-brand" />
                            <span className="text-base font-medium">Generating summary...</span>
                        </div>
                    ) : (
                        <div className="text-app-text">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                            >
                                {summary}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </SidePanel>
    );
}
