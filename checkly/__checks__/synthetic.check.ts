import { BrowserCheck, Frequency } from 'checkly/constructs';
import * as path from 'path';

// Hourly browser synthetic check against production. Mirrors the intent of the
// repo's @synthetic Playwright specs but is self-contained so it runs cleanly
// in Checkly's runtime (no app/workspace imports).
new BrowserCheck('homepage-synthetic', {
  name: 'Production homepage synthetic',
  activated: true,
  frequency: Frequency.EVERY_1H,
  code: {
    entrypoint: path.join(__dirname, 'synthetic.spec.ts')
  }
});
