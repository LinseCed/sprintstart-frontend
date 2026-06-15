import Keycloak from 'keycloak-js';

/**
 * Keycloak configuration for the SprintStart frontend.
 * 
 * Uses the default local development settings as defined in the docker-compose.yaml.
 */
const keycloak = new Keycloak({
    url: 'http://localhost:8081',
    realm: 'sprintstart',
    clientId: 'sprintstart-frontend',
});

export default keycloak;
