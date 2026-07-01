import keycloak from '../config/keycloak';

/**
 * Standard API response error class.
 */
export class ApiError extends Error {
    public status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

/**
 * A central API client wrapper around the native fetch API.
 * Automatically injects the Keycloak JWT token into the Authorization header.
 */
export const apiClient = {
    /**
     * Performs an authenticated fetch request.
     *
     * @param endpoint - The API endpoint (e.g., '/api/v1/users/me').
     * @param options - Standard fetch options.
     * @returns The parsed JSON response.
     * @throws ApiError if the response is not OK.
     */
    async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        // Ensure the token is up to date (refresh if it expires in < 30s)
        try {
            if (keycloak.authenticated) {
                await keycloak.updateToken(30);
            }
        } catch (error) {
            console.error('Failed to refresh Keycloak token', error);
            void keycloak.login(); // Redirect to login if token refresh fails completely
        }

        const headers = new Headers(options.headers);

        if (keycloak.token) {
            headers.set('Authorization', `Bearer ${keycloak.token}`);
        }

        // Default content type to JSON if not specified and not FormData
        if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(endpoint, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Token likely expired or invalid, force re-auth
            void keycloak.login();
            throw new ApiError(401, 'Unauthorized');
        }

        if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Unknown error');
            throw new ApiError(response.status, errorBody || response.statusText);
        }

        const text = await response.text();
        if (!text.trim()) {
            return {} as T;
        }
        return JSON.parse(text) as T;
    }
};
