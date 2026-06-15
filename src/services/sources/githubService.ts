import { userService } from "../userService";
import { knowledgeService } from "../knowledgeService";

export type ConnectGithubRepositoryRequest = {
    owner: string;
    name: string;
    token?: string;
};

/**
 * Connects a GitHub repository to SprintStart by fetching its contents and
 * uploading them to the knowledge base.
 *
 * This implementation runs entirely in the frontend.
 *
 * @param request - The GitHub repository owner, repository name, and optional PAT.
 * @throws Error if the ingestion fails.
 */
export async function connectGithubRepository(
    request: ConnectGithubRepositoryRequest,
): Promise<void> {
    const { owner, name, token } = request;
    const profile = await userService.getProfile();
    
    if (!profile) {
        throw new Error("User not authenticated");
    }

    const headers: HeadersInit = {
        "Accept": "application/vnd.github.v3+json",
    };
    if (token) {
        headers["Authorization"] = `token ${token}`;
    }

    // 1. Get the default branch
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${name}`, { headers });
    if (!repoRes.ok) {
        throw new Error(`Failed to fetch repository info: ${repoRes.statusText}`);
    }
    const repoData = await repoRes.json();
    const defaultBranch = repoData.default_branch || "main";

    // 2. Get the recursive tree
    const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${name}/git/trees/${defaultBranch}?recursive=1`,
        { headers }
    );
    if (!treeRes.ok) {
        throw new Error(`Failed to fetch repository tree: ${treeRes.statusText}`);
    }
    const treeData = await treeRes.json();

    // 3. Filter for relevant files (skip binaries, common ignore patterns)
    const ALLOWED_EXTENSIONS = [".md", ".txt", ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".kt", ".c", ".cpp", ".h", ".go", ".rs", ".yaml", ".yml", ".json", ".sql"];
    const filesToIngest = treeData.tree.filter((item: any) => {
        if (item.type !== "blob") return false;
        const path = item.path.toLowerCase();
        
        // Ignore common build/dependency folders
        if (path.includes("node_modules/") || path.includes(".git/") || path.includes("dist/") || path.includes("build/") || path.includes(".venv/")) {
            return false;
        }

        return ALLOWED_EXTENSIONS.some(ext => path.endsWith(ext));
    });

    if (filesToIngest.length === 0) {
        throw new Error("No suitable files found in the repository.");
    }

    // 4. Limit the number of files for the initial ingestion to avoid overwhelming the system
    const MAX_FILES = 100;
    const limitedFiles = filesToIngest.slice(0, MAX_FILES);

    // 5. Download and Upload
    for (const item of limitedFiles) {
        try {
            const contentRes = await fetch(item.url, { headers });
            if (!contentRes.ok) continue;
            
            const contentData = await contentRes.json();
            const base64 = contentData.content.replace(/\s/g, "");
            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const rawContent = new TextDecoder().decode(bytes);
            
            const blob = new Blob([rawContent], { type: "text/plain" });
            const file = new File([blob], item.path.split("/").pop() || "github-file", { type: "text/plain" });
            
            // We use the full path as filename to preserve some context in the backend if possible
            // but the current knowledgeService uses file.name which might be just the basename.
            // Let's create a new File with the full path as the name.
            const fileWithSubpath = new File([blob], item.path.replaceAll("/", "_"), { type: "text/plain" });

            await knowledgeService.uploadDocuments([fileWithSubpath], profile.id);
        } catch (error) {
            console.error(`Failed to ingest file ${item.path}:`, error);
        }
    }
}