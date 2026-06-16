import Keycloak from 'keycloak-js';

/**
 * Keycloak configuration for the SprintStart frontend.
 * 
 * Uses environment variables from .env for flexibility across different environments.
 */
const keycloak = new Keycloak({
    url: (import.meta.env.VITE_KEYCLOAK_AUTHORITY || 'http://localhost:8081/realms/sprintstart').replace('/realms/sprintstart', ''),
    realm: 'sprintstart',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'sprintstart-frontend',
});

export default keycloak;
