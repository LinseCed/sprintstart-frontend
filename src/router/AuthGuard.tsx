import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { assessmentService, isAssessmentGateSnoozed } from "../services/assessmentService";

interface AuthGuardProps {
    children: ReactNode;
}

interface LocationState {
    from?: {
        pathname: string;
    };
}

/**
 * Route guard for authentication and the new hire's day-one landing.
 *
 * Unauthenticated visitors are sent to the login page. The skill assessment no
 * longer gates the app: a `USER` who has never completed it (`GET
 * /me/assessment/status`) is sent to their **first week** (`/first-week`) instead
 * of the assessment — but only from the landing route, so they can navigate
 * freely everywhere else. The assessment is offered there as an optional,
 * non-blocking step; it never blocks the first week. The status is re-checked on
 * navigation while still un-assessed, so completing it stops the landing redirect
 * without a reload; a failed check fails open, and "Skip for now" snoozes the
 * redirect for 24 hours (client-side, per user).
 */
export function AuthGuard({ children }: AuthGuardProps) {
    const { status, profile } = useAuth();
    const location = useLocation();

    const [needsSkillAssessment, setNeedsSkillAssessment] = useState(false);
    const [checkingSkillAssessment, setCheckingSkillAssessment] = useState(false);
    const completedRef = useRef(false);

    const profileId = profile?.id;
    const permissionGroup = profile?.permissionGroup;

    useEffect(() => {
        let cancelled = false;

        const checkSkillAssessment = async () => {
            if (status !== "authenticated" || !profileId) {
                completedRef.current = false;
                setNeedsSkillAssessment(false);
                setCheckingSkillAssessment(false);
                return;
            }

            if (
                permissionGroup !== "USER" ||
                completedRef.current ||
                isAssessmentGateSnoozed(profileId)
            ) {
                setNeedsSkillAssessment(false);
                setCheckingSkillAssessment(false);
                return;
            }

            setCheckingSkillAssessment(true);
            try {
                const { completed } = await assessmentService.fetchAssessmentStatus();
                if (cancelled) return;
                completedRef.current = completed;
                setNeedsSkillAssessment(!completed);
            } catch {
                if (cancelled) return;
                setNeedsSkillAssessment(false);
            } finally {
                if (!cancelled) setCheckingSkillAssessment(false);
            }
        };

        void checkSkillAssessment();

        return () => {
            cancelled = true;
        };
    }, [status, profileId, permissionGroup, location.pathname]);

    if (status === "loading" || checkingSkillAssessment) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-app-bg">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
            </div>
        );
    }

    if (status === "unauthenticated" && location.pathname !== "/login") {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (status === "authenticated" && location.pathname === "/login") {
        const state = location.state as LocationState;
        const from = state?.from?.pathname || "/";

        return <Navigate to={from} replace />;
    }

    // A new hire's day one is their first week, not the assessment. An un-assessed USER landing on
    // the root is sent to /first-week; from anywhere else they navigate freely, so the assessment
    // is genuinely optional. The snooze is re-read at render time (not just in the effect) so "Skip
    // for now" takes effect on the very next navigation, before the effect recomputes.
    if (
        status === "authenticated" &&
        needsSkillAssessment &&
        !(profileId && isAssessmentGateSnoozed(profileId)) &&
        location.pathname === "/"
    ) {
        return <Navigate to="/first-week" replace />;
    }

    return <>{children}</>;
}
