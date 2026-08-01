import type { Locator, Page } from '@playwright/test';
import { test, expect, expectNoViolations } from './utils/axe';
import {
  authStatePath,
  createCopresenter,
  createPresenter,
  createPresenterAdmin,
  loginOnPage,
  type SharedAuthRole
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
type A11yRoute = {
  route: string;
  // Replaces `route` in the test title — for routes that redirect, so the title
  // can name both ends.
  label?: string;
  // Narrow the scan to a selector (axe .include), e.g. to skip an embedded
  // third-party widget by only scanning our own region.
  include?: string;
  // Exclude one or more selectors from the scan (axe .exclude), e.g. a
  // third-party iframe whose markup we don't control.
  exclude?: string | string[];
  // Turn off specific rule ids (axe .disableRules), e.g. ['color-contrast'],
  // for a documented, tracked deferral. Prefer this over excluding markup.
  disableRules?: string[];
  // For routes that redirect: the resolved URL to settle on before scanning.
  awaitUrl?: RegExp;
  // A real-content locator that only appears once this route's Suspense
  // boundary resolves. Waited on before scanning so axe sees streamed content,
  // not the "Loading…" fallback. Omit for synchronous routes (and for
  // /auth/login|register, whose fallback already IS the real form).
  ready?: (page: Page) => Locator;
};

// One test per route: navigate, wait for real (not fallback) content, scan.
// Module scope so the public sweep and the authenticated per-role sweeps below
// all build their tests the same way.
const defineA11yTests = (routes: A11yRoute[]) => {
  for (const {
    route,
    label,
    include,
    exclude,
    disableRules,
    awaitUrl,
    ready
  } of routes) {
    test(
      `${label ?? route} has no detectable a11y violations`,
      { tag: ['@a11y'] },
      async ({ page, makeAxeBuilder }, testInfo) => {
        await page.goto(route);
        if (awaitUrl) await page.waitForURL(awaitUrl, { timeout: 15000 });
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
};

// Read-only, identity-agnostic pages behind auth: any user of the right role
// will do, so they run against that role's per-run storageState from
// auth.setup.ts. storageState is a describe-level option, hence one describe
// per role.
const describeSharedRoleRoutes = (role: SharedAuthRole, routes: A11yRoute[]) =>
  test.describe(`as a shared ${role.replace('_', ' ')}`, () => {
    test.use({ storageState: authStatePath(role) });
    defineA11yTests(routes);
  });

test.describe('Accessibility (WCAG A/AA): public pages', () => {
  // Static routes plus the public year-scoped lists (these render with whatever
  // data exists for currentDisplayYear; an empty list still renders and scans).
  const publicRoutes: A11yRoute[] = [
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

  defineA11yTests(publicRoutes);
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
  // A presenter satisfies every check in this group: their own profile, their
  // own presentations, and an accepted talk for ticketYear so /ticket renders.
  describeSharedRoleRoutes('presenter', [
    {
      route: '/my-profile',
      ready: (p) => p.getByRole('textbox', { name: 'Email' })
    },
    {
      route: '/my-presentations',
      ready: (p) => p.getByRole('heading', { name: 'Submit a new Presentation' })
    },
    {
      route: '/ticket',
      label: '/ticket (→ /ticket/[ticketObject])',
      awaitUrl: /\/ticket\/.+/,
      ready: (p) => p.getByRole('heading', { name: "You're all set to go!" })
    }
  ]);

  describeSharedRoleRoutes('organizer', [
    {
      route: '/review-submissions',
      ready: (p) => p.getByText(/\d+ submitted presentations/)
    }
  ]);

  describeSharedRoleRoutes('log_viewer', [
    {
      // The logs table streams in behind a Suspense fallback ("Loading
      // logs..."), so the `load` event can fire while the DOM still shows the
      // fallback. Waiting for the LogViewer itself (its search box) keeps axe
      // from racing the stream and scanning the fallback, which would
      // non-deterministically miss violations in the table/filters (e.g. the
      // source-filter select's missing name).
      route: '/logs',
      ready: (p) => p.getByRole('searchbox')
    }
  ]);

  // Each of these is identity-bound (the page renders the logged-in user's
  // own seeded data or token), so they provision a user and log in per test.
  test.describe('role-specific pages', () => {
    test(
      '/my-presentations/edit/[id] has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({ page, makeAxeBuilder }, testInfo) => {
        // The edit route only renders for a DRAFT (is_submitted=false), so it
        // can't reuse the shared read-only presenter (whose talk is
        // accepted/submitted — navigating there would 404 and leave axe
        // scanning the loading/not-found fallback). Seed a dedicated
        // draft-owning presenter and log in as them for this one test.
        const draftPresenter = await createPresenter({
          isSubmitted: false,
          accepted: false
        });
        try {
          await page.goto('/'); // render the login button before loginOnPage looks for it
          await loginOnPage(page, draftPresenter.email);
          await page.goto(
            `/my-presentations/edit/${draftPresenter.presentationId}`
          );
          // Gate on copy unique to the resolved page — the "Edit Draft
          // Presentation" heading also renders in loading.tsx, so it can't
          // tell the Suspense fallback apart from the form.
          await expect(
            page.getByText('Edit your draft presentation below.')
          ).toBeVisible();
          const { violations } = await makeAxeBuilder().analyze();
          await expectNoViolations(violations, testInfo);
        } finally {
          await draftPresenter.cleanup();
        }
      }
    );

    test(
      '/admin/create-presenter has no detectable a11y violations',
      { tag: ['@a11y'] },
      async ({ page, makeAxeBuilder }, testInfo) => {
        const user = await createPresenterAdmin();
        try {
          await page.goto('/'); // Need to visit a page to render the login button before loginOnPage can find and click it
          await loginOnPage(page, user.email);
          await page.goto('/admin/create-presenter');
          // The panel streams in behind a Suspense fallback, so wait for the
          // form's submit button before scanning — otherwise axe can race the
          // stream and scan the fallback instead of the form.
          await expect(
            page.getByRole('button', { name: 'Create Presenter and Submit' })
          ).toBeVisible();
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
