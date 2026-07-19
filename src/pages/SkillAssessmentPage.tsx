import { AlertCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { SkillAssessmentChat } from '../features/skill-assessment/components/SkillAssessmentChat';
import { AssessmentPathView } from '../features/skill-assessment/components/AssessmentPathView';
import { useSkillAssessment } from '../features/skill-assessment/hooks/useSkillAssessment';
import { useProjectSelection } from '../features/projects/useProjectSelection';
import { useAuth } from '../context/useAuth';
import { snoozeAssessmentGate } from '../services/assessmentService';

/**
 * The new front door for onboarding: a conversational skill-chat interview
 * that places the hire on the competency graph, then transitions in place to
 * their personalized path once the interviewer is done.
 *
 * "Skip for now" snoozes the AuthGuard's assessment gate for 24 hours and
 * returns to the dashboard -- an escape hatch, not a dismissal; the gate
 * resumes once the snooze expires. The in-progress session is left as-is,
 * so coming back resumes where the interview left off.
 */
export function SkillAssessmentPage() {
    // The interview is global; the selected project only scopes the path preview
    // shown once it finishes (onboarding paths are per-project).
    const { selectedProjectId } = useProjectSelection();
    const { phase, messages, isThinking, error, path, submitAnswer, retry } =
        useSkillAssessment(selectedProjectId);
    const { profile } = useAuth();
    const navigate = useNavigate();

    const skipForNow = () => {
        if (profile?.id) snoozeAssessmentGate(profile.id);
        void navigate('/');
    };

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-app-bg p-8">
                <div className="max-w-md text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-app-danger-solid" />
                    <h2 className="mb-2 text-xl font-semibold text-app-text">
                        Something went wrong
                    </h2>
                    <p className="mb-6 text-sm text-app-text-muted">{error}</p>
                    <button
                        onClick={retry}
                        className="rounded-xl bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-app-bg">
            <div className="shrink-0 border-b border-app-border bg-app-bg/80 px-6 py-4 backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                    <PageHeader
                        icon={Sparkles}
                        title={phase === 'chat' ? "Let's get to know your skills" : 'Your personalized path'}
                        subtitle={
                            phase === 'chat'
                                ? "A few quick questions so we can tailor onboarding to what you already know."
                                : 'Nodes you already have covered are marked mastered; everything else unlocks as you go.'
                        }
                    />
                    {phase === 'chat' && (
                        <button
                            type="button"
                            onClick={skipForNow}
                            className="shrink-0 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text-muted transition-colors hover:border-app-brand hover:text-app-text"
                        >
                            Skip for now
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
                {phase === 'chat' ? (
                    <SkillAssessmentChat
                        messages={messages}
                        isThinking={isThinking}
                        onSubmitAnswer={submitAnswer}
                    />
                ) : path ? (
                    <AssessmentPathView path={path} />
                ) : null}
            </div>
        </div>
    );
}
