import { useState, type FormEvent } from "react";
import { Key, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { ApiError } from "../../../services/apiClient";
import {
    addGithubPat,
    deleteGithubPat,
    updateGithubPat,
} from "../../../services/sources/githubService";

const INVALID_TOKEN_MESSAGE =
    "Invalid token format. Use a classic PAT (ghp_...) or a fine-grained PAT (github_pat_...).";

function parseApiError(error: unknown, validationFallback: string): string {
    if (!(error instanceof ApiError)) {
        return error instanceof Error ? error.message : "An unexpected error occurred.";
    }
    try {
        const body = JSON.parse(error.message) as { message?: string };
        if (body.message) return body.message;
    } catch {
        // not JSON
    }
    return validationFallback;
}

type TokensTabProps = {
    tokenNames: string[];
    onRefresh: () => void;
};

export function TokensTab({ tokenNames, onRefresh }: TokensTabProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addName, setAddName] = useState("");
    const [addToken, setAddToken] = useState("");
    const [addError, setAddError] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const [rotatingName, setRotatingName] = useState<string | null>(null);
    const [rotateToken, setRotateToken] = useState("");
    const [rotateError, setRotateError] = useState("");
    const [isRotating, setIsRotating] = useState(false);

    const [pendingDeleteName, setPendingDeleteName] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const handleAddOpen = () => {
        setIsAddOpen(true);
        setAddName("");
        setAddToken("");
        setAddError("");
    };

    const handleAddCancel = () => {
        if (isAdding) return;
        setIsAddOpen(false);
        setAddError("");
    };

    const handleAddSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsAdding(true);
        setAddError("");

        try {
            await addGithubPat(addName.trim(), addToken.trim());
            setIsAddOpen(false);
            setAddName("");
            setAddToken("");
            onRefresh();
        } catch (error) {
            setAddError(parseApiError(error, INVALID_TOKEN_MESSAGE));
        } finally {
            setIsAdding(false);
        }
    };

    const handleRotateOpen = (name: string) => {
        setRotatingName(name);
        setRotateToken("");
        setRotateError("");
        setPendingDeleteName(null);
    };

    const handleRotateCancel = () => {
        if (isRotating) return;
        setRotatingName(null);
        setRotateError("");
    };

    const handleRotateSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!rotatingName) return;
        setIsRotating(true);
        setRotateError("");

        try {
            await updateGithubPat(rotatingName, rotateToken.trim());
            setRotatingName(null);
            setRotateToken("");
            onRefresh();
        } catch (error) {
            setRotateError(parseApiError(error, INVALID_TOKEN_MESSAGE));
        } finally {
            setIsRotating(false);
        }
    };

    const handleDeleteRequest = (name: string) => {
        setPendingDeleteName(name);
        setDeleteError("");
        setRotatingName(null);
    };

    const handleDeleteCancel = () => {
        if (isDeleting) return;
        setPendingDeleteName(null);
        setDeleteError("");
    };

    const handleDeleteConfirm = async () => {
        if (!pendingDeleteName) return;
        setIsDeleting(true);
        setDeleteError("");

        try {
            await deleteGithubPat(pendingDeleteName);
            setPendingDeleteName(null);
            onRefresh();
        } catch (error) {
            setDeleteError(parseApiError(error, "Failed to delete token."));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-app-text">
                    {tokenNames.length} {tokenNames.length === 1 ? "token" : "tokens"}
                </span>

                {!isAddOpen && (
                    <button
                        type="button"
                        onClick={handleAddOpen}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-app-brand bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:border-app-brand-hover hover:bg-app-brand-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Add Token
                    </button>
                )}
            </div>

            {isAddOpen && (
                <form
                    onSubmit={(e) => void handleAddSubmit(e)}
                    className="overflow-hidden rounded-2xl border border-app-border bg-app-surface p-5"
                >
                    <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-app-text">New GitHub PAT</span>
                        <button
                            type="button"
                            onClick={handleAddCancel}
                            disabled={isAdding}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:opacity-50"
                            aria-label="Cancel"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label htmlFor="add-token-name" className="mb-1.5 block text-xs font-medium text-app-text-muted">
                                Token name
                            </label>
                            <input
                                id="add-token-name"
                                value={addName}
                                onChange={(e) => setAddName(e.target.value)}
                                placeholder="e.g. default"
                                required
                                disabled={isAdding}
                                className="h-11 w-full rounded-xl border border-app-border bg-app-surface px-4 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow disabled:opacity-60"
                            />
                        </div>

                        <div>
                            <label htmlFor="add-token-value" className="mb-1.5 block text-xs font-medium text-app-text-muted">
                                Token (ghp_...)
                            </label>
                            <input
                                id="add-token-value"
                                type="password"
                                value={addToken}
                                onChange={(e) => setAddToken(e.target.value)}
                                placeholder="ghp_... or github_pat_..."
                                required
                                disabled={isAdding}
                                className="h-11 w-full rounded-xl border border-app-border bg-app-surface px-4 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow disabled:opacity-60"
                            />
                        </div>

                        {addError && (
                            <p className="text-sm text-app-danger-text">{addError}</p>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleAddCancel}
                                disabled={isAdding}
                                className="inline-flex h-11 items-center justify-center rounded-xl border border-app-border bg-app-surface px-5 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isAdding ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Add Token"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {tokenNames.length === 0 && !isAddOpen ? (
                <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface p-8">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Key className="h-8 w-8 text-app-text-disabled" />
                        <div>
                            <p className="text-base font-medium text-app-text">No tokens yet</p>
                            <p className="mt-1 text-sm text-app-text-muted">
                                Add a GitHub Personal Access Token to enable repository ingestion.
                            </p>
                        </div>
                    </div>
                </div>
            ) : tokenNames.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
                    {tokenNames.map((name) => (
                        <div key={name} className="border-b border-app-border last:border-b-0">
                            <div className="flex items-center gap-4 px-5 py-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-surface-muted">
                                    <Key className="h-4 w-4 text-app-text-muted" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-app-text">{name}</p>
                                    <p className="text-xs text-app-text-muted">GitHub PAT (classic)</p>
                                </div>

                                {pendingDeleteName !== name && rotatingName !== name && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleRotateOpen(name)}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-3 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Rotate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteRequest(name)}
                                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-app-danger-bg bg-app-danger-bg px-3 text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-solid hover:text-white"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>

                            {rotatingName === name && (
                                <form
                                    onSubmit={(e) => void handleRotateSubmit(e)}
                                    className="border-t border-app-border bg-app-surface-muted px-5 py-4"
                                >
                                    <p className="mb-3 text-xs font-medium text-app-text-muted">
                                        Enter a new token to replace <strong>{name}</strong>
                                    </p>
                                    <div className="flex items-start gap-2">
                                        <input
                                            type="password"
                                            value={rotateToken}
                                            onChange={(e) => setRotateToken(e.target.value)}
                                            placeholder="ghp_... or github_pat_..."
                                            required
                                            disabled={isRotating}
                                            className="h-11 flex-1 rounded-xl border border-app-border bg-app-surface px-4 text-sm text-app-text outline-none placeholder:text-app-text-disabled focus:border-app-brand-border-strong focus:ring-2 focus:ring-app-brand-glow disabled:opacity-60"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isRotating}
                                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-app-brand px-4 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isRotating ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4" />
                                            )}
                                            {isRotating ? "Rotating..." : "Confirm"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRotateCancel}
                                            disabled={isRotating}
                                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border bg-app-surface text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:opacity-50"
                                            aria-label="Cancel rotate"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                    {rotateError && (
                                        <p className="mt-2 text-sm text-app-danger-text">{rotateError}</p>
                                    )}
                                </form>
                            )}

                            {pendingDeleteName === name && (
                                <div className="border-t border-app-border bg-app-danger-bg px-5 py-4">
                                    <p className="mb-3 text-sm text-app-danger-text">
                                        Delete <strong>{name}</strong>? This cannot be undone and may break connected repositories.
                                    </p>
                                    {deleteError && (
                                        <p className="mb-2 text-sm text-app-danger-text">{deleteError}</p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => void handleDeleteConfirm()}
                                            disabled={isDeleting}
                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-app-danger-solid px-4 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Deleting...
                                                </>
                                            ) : (
                                                "Delete"
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeleteCancel}
                                            disabled={isDeleting}
                                            className="inline-flex h-9 items-center justify-center rounded-xl border border-app-border bg-app-surface px-4 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
