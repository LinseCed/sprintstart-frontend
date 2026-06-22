import { useState } from 'react';
import { userService } from '../../../services/userService';

/**
 * Form component for changing the user's password.
 * Includes validation for matching passwords and minimum length.
 */
export function PasswordForm() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsSaving(true);
        try {
            await userService.updatePassword(oldPassword, newPassword);
            setSuccess(true);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (_err) {
            setError('Failed to update password. Please check your old password.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="rounded-xl border border-app-border bg-app-surface p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-app-text">Change Password</h2>
            
            <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        Password updated successfully.
                    </div>
                )}

                <div className="space-y-1">
                    <label htmlFor="oldPassword" className="text-sm font-medium text-app-text">Current Password</label>
                    <input
                        id="oldPassword"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text transition-colors focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="newPassword" className="text-sm font-medium text-app-text">New Password</label>
                    <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text transition-colors focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-app-text">Confirm New Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text transition-colors focus:border-app-brand focus:outline-none focus:ring-1 focus:ring-app-brand"
                        required
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSaving || !oldPassword || !newPassword || !confirmPassword}
                        className="rounded-lg bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-app-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSaving ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
