import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://qahiring.dev.fishingbooker.com/api/v1_3',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    watchForFileChanges: false,
    env: {
      // Basic Auth
      basicAuthUser: 'fishingbooker',
      basicAuthPass: 'QAFBTest',

      // Auth token
      token: 'NsDpMMpgUB1N7V4R0qcT',

      // Headers
      xDeviceId: '52E7614C-4C4C-4450-A3D5-AE6F7E550B43',
      xApplication: 'captain|2.53.1',
      xDevice: 'iPhone 15 Pro Max|iOS|18.0',
      userAgent: 'QA hiring',

      // Crew member IDs
      crewWithPhotos: [3329, 3330],
      crewWithoutPhotos: [3331, 3332],
    },
  },
});
