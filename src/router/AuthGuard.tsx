import type { ReactNode } from 'react';

import { useEffect, useState } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../context/useAuth';

import { WorkingArea } from '../services/types.ts';

import {

    getTeamMember,

    hasCompletedSkillAssessment,

} from '../services/teamManagementService';

  

interface AuthGuardProps {

    children: ReactNode;

}

  

interface LocationState {

    from?: {

        pathname: string;

    };

}

  

export function AuthGuard({ children }: AuthGuardProps) {

    const { status, profile } = useAuth();

    const location = useLocation();

  

    const [needsSkillAssessment, setNeedsSkillAssessment] = useState(false);

    const [checkingSkillAssessment, setCheckingSkillAssessment] =

        useState(false);

  

    useEffect(() => {

        async function checkSkillAssessment() {

            if (status !== 'authenticated' || !profile?.id) return;

  

            if (

                location.pathname === '/login' ||

                location.pathname === '/selection-wizard' ||

                location.pathname === '/skill-wizard'

            ) {

                return;

            }

  

            setCheckingSkillAssessment(true);

  

            const teamMember = await getTeamMember(profile.id);

            const completed = await hasCompletedSkillAssessment(profile.id);

  

            setNeedsSkillAssessment(

                !!teamMember && teamMember.roles.length > 0 && !completed

            );

  

            setCheckingSkillAssessment(false);

        }

  

        void checkSkillAssessment();

    }, [status, profile?.id, location.pathname]);

  

    if (status === 'loading' || checkingSkillAssessment) {

        return (

            <div className="flex h-screen w-full items-center justify-center bg-app-bg">

                <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />

            </div>

        );

    }

  

    // 1. If not logged in, force to /login

    if (status === 'unauthenticated' && location.pathname !== '/login') {

        return <Navigate to="/login" state={{ from: location }} replace />;

    }

  

    // 2. Prevent authenticated users from going back to login

    if (status === 'authenticated' && location.pathname === '/login') {

        const state = location.state as LocationState;

        const from = state?.from?.pathname || '/';

        return <Navigate to={from} replace />;

    }

  

    // 3. No working area yet → selection wizard

    if (

        status === 'authenticated' &&

        profile?.workingArea === WorkingArea.NO_WORKING_AREA &&

        location.pathname !== '/selection-wizard'

    ) {

        return <Navigate to="/selection-wizard" replace />;

    }

  

    // 4. Has assigned project role but no skill assessment yet → skill wizard

    if (

        status === 'authenticated' &&

        profile?.id &&

        needsSkillAssessment &&

        location.pathname !== '/skill-wizard'

    ) {

        return <Navigate to="/skill-wizard" replace />;

    }

  

    return <>{children}</>;

}