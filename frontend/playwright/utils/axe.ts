import { test as base, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';

// Shared baseline config: target WCAG A/AA, the level this site commits to.
// Exposed both as a plain factory (for tests that drive their own Page, e.g. a
// shared beforeAll session) and as a fixture wrapping it (for the common
// per-test Page). Either way the returned builder can still chain
// .include()/.exclude()/.disableRules() per page where needed.
export const configuredAxeBuilder = (page: Page) =>
  new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa'
  ]);

export const test = base.extend<{ makeAxeBuilder: () => AxeBuilder }>({
  makeAxeBuilder: async ({ page }, use) => {
    await use(() => configuredAxeBuilder(page));
  }
});

export { expect };

// Attach the full results to the HTML report and produce a readable assertion
// message listing each rule, impact, and the offending selectors, so a failure
// is actionable without re-running with a different reporter.
export const expectNoViolations = async (
  violations: Result[],
  testInfo: TestInfo
) => {
  await testInfo.attach('axe-results', {
    body: JSON.stringify(violations, null, 2),
    contentType: 'application/json'
  });
  const summary = violations
    .map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes
          .map((n) => n.target.join(' '))
          .join('\n  ')}`
    )
    .join('\n\n');
  expect(violations, summary).toEqual([]);
};
