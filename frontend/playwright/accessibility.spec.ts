import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';
import {
  test,
  expect,
  configuredAxeBuilder,
  expectNoViolations
} from './utils/axe';
import {
  createCopresenter,
  createLogViewer,
  createOrganizer,
  createPresenter,
  loginOnPage,
  type SeededUser
} from './utils';
import {
  COPRESENTER_INVITE_WORKFLOW,
  currentDisplayYear
} from '@/app/configConstants';
import { generateInviteToken } from '@/lib/copresenterInviteToken';

// Site-wide WCAG 2.0/2.1 A/AA sweep: one test per route in src/app. axe-core
// only catches the machine-decidable subset of WCAG (labels, landmarks,
// contrast, names, valid ARIA, etc.), so a green run is a guardrail, not a
// certificate. Tagged @a11y so the whole sweep can be run/skipped as a unit:
//   npm run playwright -- --project firefox --reporter=line --grep @a11y

// A route to sweep, with optional per-route escape hatches for when a page has
// a known/deferred issue we don't want to block the whole sweep on. All default
// to undefined, i.e. scan the full page against every A/AA rule.
type PublicRoute = {
  route: string;
  // Narrow the scan to a selector (axe .include), e.g. to skip an embedded
  // third-party widget by only scanning our own region.
  include?: string;
  // Exclude one or more selectors from the scan (axe .exclude), e.g. a
  // third-party iframe whose markup we don't control.
  exclude?: string | string[];
  // Turn off specific rule ids (axe .disableRules), e.g. ['color-contrast'],
  // for a documented, tracked deferral. Prefer this over excluding markup.
  disableRules?: string[];
  // A real-content locator that only appears once this route's Suspense
  // boundary resolves. Waited on before scanning so axe sees streamed content,
  // not the "Loading…" fallback. Omit for synchronous routes (and for
  // /auth/login|register, whose fallback already IS the real form).
  ready?: (page: Page) => Locator;
};

test.describe('Accessibility (WCAG A/AA): public pages', () => {
  // Static routes plus the public year-scoped lists (these render with whatever
  // data exists for currentDisplayYear; an empty list still renders and scans).
  const publicRoutes: PublicRoute[] = [
    { route: '/' },
    { route: '/about-us' },
    { route: '/access-denied' },
    { route: '/auth-blocked' },
    { route: '/auth/login' },
    { route: '/auth/register' },
    {
      route: '/auth/validateLogin',
      ready: (p) => p.getByRole('form', { name: 'Verification Code form' })
    },
    { route: '/full-agenda', ready: (p) => p.locator('#presentations') },
    { route: '/login-required' },
    { route: '/media' },
    { route: '/our-team' },
    { route: '/panels/labview-and-python' },
    { route: '/panels/open-source' },
    {
      route: `/presentation-list/${currentDisplayYear}`,
      ready: (p) =>
        p.getByRole('heading', { name: `${currentDisplayYear} Presentations` })
    },
    {
      route: `/presenter-list/${currentDisplayYear}`,
      ready: (p) =>
        p.getByRole('heading', { name: `${currentDisplayYear} Presenters` })
    }
  ];

  for (const { route, include, exclude, disableRules, ready } of publicRoutes) {
    test(
      `${route} has no detectable a11y violations`,
      { tag: ['@a11y'] },
      async ({ page, makeAxeBuilder }, testInfo) => {
        await page.goto(route);
        // Wait for the streamed content (not the Suspense fallback) before axe
        // scans — otherwise a green run can mean "scanned <p>Loading…</p>".
        if (ready) await expect(ready(page)).toBeVisible();
        let builder = makeAxeBuilder();
        if (include) builder = builder.include(include);
        if (exclude) builder = builder.exclude(exclude);
        if (disableRules) builder = builder.disableRules(disableRules);
        const { violations } = await builder.analyze();
        await expectNoViolations(violations, testInfo);
      }
    );
  }
});

test.describe('Accessibility (WCAG A/AA): public dynamic pages', () => {
  // Detail pages need a real, accepted presentation/presenter to render, so
  // seed one and tear it down afterwards. No login required — these are public.
  test(
    '/presentations/[id] has no detectable a11y violations',
    { tag: ['@a11y'] },
    async ({ page, makeAxeBuilder }, testInfo) => {
      const presenter = await createPresenter();
      try {
        await page.goto(`/presentations/${presenter.presentationId}`);
        await expect(
          page.getByRole('heading', { level: 2 }).first()
        ).toBeVisible();
        const { violations } = await makeAxeBuilder().analyze();
        await expectNoViolations(violations, testInfo);
      } finally {
        await presenter.cleanup();
      }
    }
  );

  test(
    '/presenters/[id] has no detectable a11y violations',
    { tag: ['@a11y'] },
    async ({ page, makeAxeBuilder }, testInfo) => {
      const presenter = await createPresenter();
      try {
        await page.goto(`/presenters/${presenter.userId}`);
        const { violations } = await makeAxeBuilder().analyze();
        await expectNoViolations(violations, testInfo);
      } finally {
        await presenter.cleanup();
      }
    }
  );
});

test.describe('Accessibility (WCAG A/AA): authenticated pages', () => {
  // These pages are read-only and don't exercise the login flow itself, so a
  // single presenter session is logged in once (beforeAll) and reused across
  // all of them — a presenter satisfies every check here: their own profile,
  // their own presentations, and an accepted talk for ticketYear so /ticket
  // renders.
  test.describe('shared presenter session (read-only)', () => {
    let context: BrowserContext;
    let page: Page;
    let presenter: SeededUser;

    test.beforeAll(async ({ browser }) => {
      // Create the page from an explicit context, not browser.newPage():
      // @axe-core/playwright refuses to run on browser.newPage() pages
      // ("Please use browser.newContext()").
      context = await browser.newContext();
      page = await context.newPage();
      await page.goto('/'); // Render the login button before loginOnPage looks for it.
      presenter = await createPresenter();
      await loginOnPage(page, presenter.email);
    });

    test.afterAll(async () => {
      await presenter.cleanup();
      await context.close();
    });

    const scan = async (route: string, testInfo: TestInfo, ready?: Locator) => {
      await page.goto(route);
      // Wait for the streamed content (not the Suspense fallback) before axe
      // scans. `page.getByRole(...)` passed by callers is lazy, so evaluating
      // it here (after beforeAll assigned `page`) is safe.
      if (ready) await expect(ready).toBeVisible();
      const { violations } = await configuredAxeBuilder(page).analyze();
      await expectNoViolations(violations, testInfo);
    };

    test(
      '/my-profile has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({}, testInfo) =>
        scan('/my-profile', testInfo, page.getByRole('textbox', { name: 'Email' }))
    );

    test(
      '/my-presentations has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({}, testInfo) =>
        scan(
          '/my-presentations',
          testInfo,
          page.getByRole('heading', { name: 'Submit a new Presentation' })
        )
    );

    test(
      '/my-presentations/edit/[id] has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({}, testInfo) =>
        scan(
          `/my-presentations/edit/${presenter.presentationId}`,
          testInfo,
          page.getByRole('heading', { name: 'Edit Draft Presentation' })
        )
    );

    test(
      '/ticket (→ /ticket/[ticketObject]) has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({}, testInfo) => {
        await page.goto('/ticket');
        await page.waitForURL(/\/ticket\/.+/, { timeout: 15000 });
        await expect(
          page.getByRole('heading', { name: "You're all set to go!" })
        ).toBeVisible();
        const { violations } = await configuredAxeBuilder(page).analyze();
        await expectNoViolations(violations, testInfo);
      }
    );
  });

  // Each of these needs a distinct privileged role, so they log in per test.
  // They exercise the page, not the login flow, but can't share the presenter
  // session above.
  test.describe('role-specific pages', () => {
    test(
      '/review-submissions has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({ page, makeAxeBuilder }, testInfo) => {
        const user = await createOrganizer();
        try {
          await page.goto('/'); // Need to visit a page to render the login button before loginOnPage can find and click it
          await loginOnPage(page, user.email);
          await page.goto('/review-submissions');
          await expect(
            page.getByText(/list of \d+ presentations/)
          ).toBeVisible();
          const { violations } = await makeAxeBuilder().analyze();
          await expectNoViolations(violations, testInfo);
        } finally {
          await user.cleanup();
        }
      }
    );

    test(
      '/logs has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({ page, makeAxeBuilder }, testInfo) => {
        const user = await createLogViewer();
        try {
          await page.goto('/'); // Need to visit a page to render the login button before loginOnPage can find and click it
          await loginOnPage(page, user.email);
          await page.goto('/logs');
          // The logs table streams in behind a Suspense fallback ("Loading
          // logs..."), so the `load` event can fire while the DOM still shows
          // the fallback. Wait for the LogViewer itself (its search box) to
          // render before scanning — otherwise axe races the stream and may
          // scan the fallback, non-deterministically missing violations in the
          // table/filters (e.g. the source-filter select's missing name).
          await expect(page.getByRole('searchbox')).toBeVisible();
          const { violations } = await makeAxeBuilder().analyze();
          await expectNoViolations(violations, testInfo);
        } finally {
          await user.cleanup();
        }
      }
    );

    test(
      '/copresenter-invite/[token] has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({ page, makeAxeBuilder }, testInfo) => {
        // The invite page resolves the logged-in user against the token's
        // presenterId, so log in as the copresenter the token is minted for.
        const copresenter = await createCopresenter();
        try {
          const token = generateInviteToken(
            copresenter.presentationId!,
            copresenter.userId
          );
          await page.goto('/'); // Need to visit a page to render the login button before loginOnPage can find and click it
          await loginOnPage(page, copresenter.email);
          await page.goto(`/copresenter-invite/${token}`);
          // When the workflow is disabled the route's synchronous parent calls
          // notFound() before the Suspense boundary — a static 404 with no
          // streamed content to race, so no anchor. When enabled the invite
          // streams behind a "Loading..." fallback, so wait for the resolved
          // heading before scanning. Keyed off the flag so this stays correct
          // automatically if the workflow is turned on.
          if (COPRESENTER_INVITE_WORKFLOW) {
            await expect(
              page.getByRole('heading', { name: 'Co-presenter invitation' })
            ).toBeVisible();
          }
          const { violations } = await makeAxeBuilder().analyze();
          await expectNoViolations(violations, testInfo);
        } finally {
          await copresenter.cleanup();
        }
      }
    );
  });
});
