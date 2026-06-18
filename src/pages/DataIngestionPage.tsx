import {
    Database,
    RefreshCw,
    Plus,
    Activity,
    AlertCircle,
} from "lucide-react";
import {
    useCallback,
    useState,
    type FormEvent,
} from "react";
import {
    connectGithubRepository,
    updateGithubRepository,
    updateAllGithubRepositories,
} from "../services/sources/githubService.ts";

type LoadingState = "idle" | "loading" | "success" | "error";

export function DataIngestionPage() {
    // State for Connect Repository
    const [connectOwner, setConnectOwner] = useState("");
    const [connectRepo, setConnectRepo] = useState("");
    const [connectState, setConnectState] = useState<LoadingState>("idle");
    const [connectError, setConnectError] = useState<string | null>(null);

    // State for Update Specific Repository
    const [updateOwner, setUpdateOwner] = useState("");
    const [updateRepo, setUpdateRepo] = useState("");
    const [updateState, setUpdateState] = useState<LoadingState>("idle");
    const [updateError, setUpdateError] = useState<string | null>(null);

    // State for Update All
    const [updateAllState, setUpdateAllState] = useState<LoadingState>("idle");
    const [updateAllError, setUpdateAllError] = useState<string | null>(null);

    const handleConnect = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setConnectState("loading");
        setConnectError(null);
        try {
            await connectGithubRepository({
                owner: connectOwner.trim(),
                name: connectRepo.trim(),
            });
            setConnectState("success");
            setConnectOwner("");
            setConnectRepo("");
        } catch (err) {
            setConnectState("error");
            setConnectError(err instanceof Error ? err.message : "Failed to connect repository");
        }
    }, [connectOwner, connectRepo]);

    const handleUpdateRepo = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setUpdateState("loading");
        setUpdateError(null);
        try {
            await updateGithubRepository({
                owner: updateOwner.trim(),
                name: updateRepo.trim(),
            });
            setUpdateState("success");
            setUpdateOwner("");
            setUpdateRepo("");
        } catch (err) {
            setUpdateState("error");
            setUpdateError(err instanceof Error ? err.message : "Failed to update repository");
        }
    }, [updateOwner, updateRepo]);

    const handleUpdateAll = useCallback(async () => {
        setUpdateAllState("loading");
        setUpdateAllError(null);
        try {
            await updateAllGithubRepositories();
            setUpdateAllState("success");
        } catch (err) {
            setUpdateAllState("error");
            setUpdateAllError(err instanceof Error ? err.message : "Failed to update all repositories");
        }
    }, []);

    return (
        <div className="min-h-screen bg-app-bg p-6 lg:p-8">
            <header className="mb-10">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-app-brand-soft p-2">
                        <Database className="h-5 w-5 text-app-brand-text" />
                    </div>
                    <h1 className="font-heading text-2xl font-bold text-app-text">
                        Data Ingestion Control Panel
                    </h1>
                </div>
                <p className="mt-2 text-sm text-app-text-muted">
                    Directly trigger GitHub ingestion actions. This panel reflects the current backend capabilities.
                </p>
            </header>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Connect Repository Section */}
                <section className="rounded-3xl border border-app-border bg-app-surface p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-full bg-app-success-bg p-2 text-app-success-text">
                            <Plus size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-app-text">Connect New Repository</h2>
                    </div>
                    
                    <form 
                        onSubmit={(e) => { void handleConnect(e); }} 
                        className="space-y-4"
                    >
                        <div>
                            <label 
                                htmlFor="connect-owner"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-app-text-subtle"
                            >
                                GitHub Owner
                            </label>
                            <input
                                id="connect-owner"
                                type="text"
                                value={connectOwner}
                                onChange={(e) => setConnectOwner(e.target.value)}
                                placeholder="e.g. google"
                                className="w-full rounded-xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:ring-2 focus:ring-app-brand"
                                required
                            />
                        </div>
                        <div>
                            <label 
                                htmlFor="connect-repo"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-app-text-subtle"
                            >
                                Repository Name
                            </label>
                            <input
                                id="connect-repo"
                                type="text"
                                value={connectRepo}
                                onChange={(e) => setConnectRepo(e.target.value)}
                                placeholder="e.g. gemini-cli"
                                className="w-full rounded-xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:ring-2 focus:ring-app-brand"
                                required
                            />
                        </div>
                        
                        {connectError && (
                            <div className="flex items-center gap-2 rounded-xl bg-app-danger-bg p-3 text-sm text-app-danger-text">
                                <AlertCircle size={16} />
                                {connectError}
                            </div>
                        )}
                        
                        {connectState === "success" && (
                            <div className="rounded-xl bg-app-success-bg p-3 text-sm text-app-success-text">
                                Connection request accepted. Ingestion started in background.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={connectState === "loading"}
                            className="w-full rounded-xl bg-app-brand py-3 text-sm font-bold text-app-text-inverse transition hover:bg-app-brand-hover disabled:opacity-50"
                        >
                            {connectState === "loading" ? "Processing..." : "Connect Repository"}
                        </button>
                    </form>
                </section>

                {/* Update Specific Repository Section */}
                <section className="rounded-3xl border border-app-border bg-app-surface p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-full bg-app-brand-soft p-2 text-app-brand-text">
                            <RefreshCw size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-app-text">Update Specific Repository</h2>
                    </div>

                    <form 
                        onSubmit={(e) => { void handleUpdateRepo(e); }} 
                        className="space-y-4"
                    >
                        <div>
                            <label 
                                htmlFor="update-owner"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-app-text-subtle"
                            >
                                GitHub Owner
                            </label>
                            <input
                                id="update-owner"
                                type="text"
                                value={updateOwner}
                                onChange={(e) => setUpdateOwner(e.target.value)}
                                placeholder="e.g. google"
                                className="w-full rounded-xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:ring-2 focus:ring-app-brand"
                                required
                            />
                        </div>
                        <div>
                            <label 
                                htmlFor="update-repo"
                                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-app-text-subtle"
                            >
                                Repository Name
                            </label>
                            <input
                                id="update-repo"
                                type="text"
                                value={updateRepo}
                                onChange={(e) => setUpdateRepo(e.target.value)}
                                placeholder="e.g. gemini-cli"
                                className="w-full rounded-xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text outline-none focus:ring-2 focus:ring-app-brand"
                                required
                            />
                        </div>

                        {updateError && (
                            <div className="flex items-center gap-2 rounded-xl bg-app-danger-bg p-3 text-sm text-app-danger-text">
                                <AlertCircle size={16} />
                                {updateError}
                            </div>
                        )}

                        {updateState === "success" && (
                            <div className="rounded-xl bg-app-success-bg p-3 text-sm text-app-success-text">
                                Update request accepted.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={updateState === "loading"}
                            className="w-full rounded-xl border border-app-border bg-app-surface py-3 text-sm font-bold text-app-text transition hover:bg-app-surface-hover disabled:opacity-50"
                        >
                            {updateState === "loading" ? "Processing..." : "Trigger Repository Update"}
                        </button>
                    </form>
                </section>

                {/* Global Actions Section */}
                <section className="col-span-full rounded-3xl border border-app-border bg-app-surface p-6 shadow-sm">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="rounded-full bg-app-brand p-2 text-app-text-inverse">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-app-text">Global Maintenance</h2>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                        <div className="max-w-md">
                            <h3 className="font-semibold text-app-text">Update All Repositories</h3>
                            <p className="mt-1 text-sm text-app-text-muted">
                                This will trigger an update for every repository currently connected to the GitHub connector. 
                                Useful for periodic manual syncs.
                            </p>
                        </div>

                        <div className="w-full sm:w-auto">
                            {updateAllError && (
                                <p className="mb-2 text-xs text-app-danger-text">{updateAllError}</p>
                            )}
                            {updateAllState === "success" && (
                                <p className="mb-2 text-xs text-app-success-text">Global update triggered.</p>
                            )}
                            <button
                                onClick={() => { void handleUpdateAll(); }}
                                disabled={updateAllState === "loading"}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-brand px-8 py-4 font-bold text-app-text-inverse transition hover:bg-app-brand-hover disabled:opacity-50 sm:w-auto"
                            >
                                <RefreshCw size={18} className={updateAllState === "loading" ? "animate-spin" : ""} />
                                {updateAllState === "loading" ? "Triggering..." : "Update All Repositories"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
