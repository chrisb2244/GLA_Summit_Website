import { defineConfig } from 'checkly';
import { Frequency } from 'checkly/constructs';

// Production synthetic monitoring. Run interactively:
//   cd checkly && npm install && npx checkly login && npx checkly deploy
//
// Cadence is tuned for the Checkly free tier (1,500 browser + 10,000 API runs
// /month): hourly browser check (~720/mo) + 10-min API ping (~4,320/mo).
// Keep this OFF the preview/deploy path — GitHub Actions covers deploy-time
// synthetic checks; Checkly is for ongoing production health + alerting.
const config = defineConfig({
  projectName: 'GLA Summit',
  logicalId: 'gla-summit',
  repoUrl: 'https://github.com/chrisb2244/GLA_Summit_Website',
  checks: {
    // Default location(s); free tier allows public locations.
    locations: ['eu-west-1'],
    tags: ['gla-summit', 'production'],
    runtimeId: '2024.02',
    // Only files ending in .check.ts declare checks; the .spec.ts beside them
    // is referenced explicitly by the BrowserCheck (no auto-registration).
    checkMatch: '**/__checks__/**/*.check.ts',
    browserChecks: {
      testMatch: [] // disable auto-discovery of *.spec.ts
    },
    frequency: Frequency.EVERY_1H
  },
  cli: {
    runLocation: 'eu-west-1'
  }
});

export default config;
