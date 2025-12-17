const config = require('../../config/env');

// Placeholder for outbound calls to identity-service (RBAC/permission checks).
// Implement with fetch/axios + JWKS verification as needed.
const identityClient = {
  async getUserPermissions(_token) {
    // TODO: call `${config.identityBaseUrl}/permissions` with bearer token
    return [];
  },
};

module.exports = identityClient;
