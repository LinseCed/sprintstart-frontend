import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

interface AuthGuardProps {
    children: ReactNode;
}

interface LocationState {
    from?: {
        pathname: string;
    };
}

/**
 * Route guard for authentication only.
 *
 * Unauthenticated visitors are sent to the login page and authenticated visitors
 * are bounced off it. The skill assessment does **not** gate the app: it is an
 * optional, non-permanent prior for matching, offered on the first-week page and
 * reachable from the sidebar. It is never the target of a redirect, so completing
 * or skipping it changes nothing about routing. That gate produced two live bugs
 * — an unsatisfiable redirect loop (frontend#19) and a 400 on a retired endpoint
 * (frontend#29); removing it here deletes that class of bug rather than moving it.
 */
export function AuthGuard({ children }: AuthGuardProps) {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "loading") {
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

    return <>{children}</>;
}
