import keycloak from '../../../config/keycloak';

/**
 * Form component for changing the user's password.
 * Redirects to the Keycloak update password flow.
 */
export function PasswordForm() {
    const handleRedirect = () => {
        // Trigger Keycloak's direct password update flow instead of the general account console
        void keycloak.login({ action: 'UPDATE_PASSWORD' });
    };

    return (
        <div className="rounded-xl border border-app-border bg-app-surface p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-app-text">Change Password</h2>
            
            <p className="mb-4 text-sm text-app-text/70">
                Password management is handled securely through our authentication provider.
            </p>
            
            <div className="pt-2">
                <button
                    onClick={handleRedirect}
                    className="rounded-lg bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-app-brand/90"
                >
                    Update Password
                </button>
            </div>
        </div>
    );
}

