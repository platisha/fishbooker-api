// cypress/support/e2e.ts
// Global support file — import custom commands or global hooks here.

// Increase default timeout for API calls on slow test environments
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('responseTimeout', 30000);
