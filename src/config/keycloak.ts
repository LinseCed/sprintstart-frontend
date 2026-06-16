import Keycloak from 'keycloak-js';

/**
 * Keycloak configuration for the SprintStart frontend.
 * 
 * Uses environment variables from .env for flexibility across different environments.
 */
const authority = String(import.meta.env.VITE_KEYCLOAK_AUTHORITY || 'http://localhost:8081/realms/sprintstart');
const clientId = String(import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'sprintstart-frontend');

const keycloak = new Keycloak({
    url: authority.replace('/realms/sprintstart', ''),
    realm: 'sprintstart',
    clientId,
});

export default keycloak;
