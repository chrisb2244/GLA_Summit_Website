/**
 * visual-compare capture spec (canonical copy lives in
 * .claude/skills/visual-compare/scripts/; setup.sh copies it to
 * frontend/playwright/visual-compare.spec.ts, which is gitignored).
 *
 * Visits every app route on two production servers — the "base" ref and the
 * "head" ref — and captures per-element computed styles, geometry, text,
 * hover/focus probes, and a full-page screenshot for each.
 * .claude/skills/visual-compare/scripts/compare.js diffs the captures.
 *
 * Config via env (setup.sh prints the exact command):
 *   VC_OUT       output dir for captures (required; tests skip without it)
 *   VC_BASE_URL  base server (default http://localhost:3001)
 *   VC_HEAD_URL  head server (default http://localhost:3002)
 *
 * If routes were added/removed between the refs, edit the capturePair lists
 * in the tests at the bottom of this file (in the copy under playwright/).
 */
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  createPresenter,
  createOrganizer,
  createLogViewer,
  type SeededUser
} from './utils/userCreation';
import { loginOnPage } from './utils/login';

const BASE = process.env.VC_BASE_URL || 'http://localhost:3001';
const HEAD = process.env.VC_HEAD_URL || 'http://localhost:3002';
const OUT = process.env.VC_OUT || '';

// Stable IDs from supabase/seeds/seed.sql (override via env if the seed changes).
const PRESENTATION_ID =
  process.env.VC_PRESENTATION_ID || '3c94aaa4-336d-428f-a71f-baabf12d8a1b';
const PRESENTER_ID =
  process.env.VC_PRESENTER_ID || '06ab35dd-6fcb-49a6-a85f-0b0bf9cbcc62';

const STYLE_PROPS = [
  'color',
  'background-color',
  'background-image',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-decoration-line',
  'text-decoration-color',
  'text-decoration-style',
  'text-transform',
  'text-overflow',
  'white-space',
  'word-break',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'display',
  'position',
  'float',
  'visibility',
  'opacity',
  'z-index',
  'overflow-x',
  'overflow-y',
  'flex-direction',
  'flex-wrap',
  'justify-content',
  'align-items',
  'align-self',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'row-gap',
  'column-gap',
  'grid-template-columns',
  'box-shadow',
  'outline-width',
  'outline-style',
  'outline-color',
  'outline-offset',
  'cursor',
  'pointer-events',
  'transform',
  'transition-property',
  'transition-duration',
  'list-style-type',
  'vertical-align',
  'object-fit',
  'appearance',
  '-webkit-line-clamp',
  'max-width',
  'min-height',
  'min-width'
];

const HOVER_PROPS = [
  'color',
  'background-color',
  'border-top-color',
  'border-bottom-color',
  'text-decoration-line',
  'text-decoration-color',
  'box-shadow',
  'outline-width',
  'outline-style',
  'outline-color',
  'cursor',
  'opacity',
  'transform',
  'filter'
];

// Browser-side snapshot: returns one entry per element, keyed by a
// class-independent structural path (tag + index among same-tag siblings).
const captureSnapshot = async (page: import('@playwright/test').Page) => {
  return page.evaluate((PROPS) => {
    const skip = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE']);
    // Normalize any CSS color notation (oklch, color-mix output, rgb, …) to a
    // canonical value via canvas, so rgb-vs-oklch identical colors don't
    // register as diffs.
    const ctx = document.createElement('canvas').getContext('2d')!;
    const normColor = (v: string) => {
      ctx.fillStyle = '#010203';
      try {
        ctx.fillStyle = v;
      } catch {
        return v;
      }
      return ctx.fillStyle === '#010203' && v !== '#010203' && !/^rgb\(1, 2, 3\)$/.test(v)
        ? v
        : (ctx.fillStyle as string);
    };
    const colorFnRe =
      /(?:oklch|oklab|lch|lab|hsl|hsla|rgb|rgba|hwb|color-mix|color)\((?:[^()]|\([^()]*\))*\)/g;
    const normValue = (prop: string, v: string) => {
      if (!v) return v;
      if (prop === 'color' || prop.endsWith('-color')) return normColor(v);
      if (colorFnRe.test(v)) {
        colorFnRe.lastIndex = 0;
        return v.replace(colorFnRe, (m) => normColor(m));
      }
      return v;
    };
    type Entry = {
      path: string;
      cls: string;
      testid?: string;
      rect: number[];
      text?: string;
      before?: string;
      after?: string;
      styles: Record<string, string>;
    };
    const result: Entry[] = [];
    const build = (el: Element, parentPath: string) => {
      if (skip.has(el.tagName)) return;
      let idx = 1;
      let sib: Element | null = el;
      while ((sib = sib.previousElementSibling)) {
        if (sib.tagName === el.tagName) idx++;
      }
      const seg = el.tagName.toLowerCase() + (idx > 1 ? `[${idx}]` : '');
      const p = parentPath ? parentPath + '>' + seg : seg;
      const cs = getComputedStyle(el);
      const styles: Record<string, string> = {};
      for (const prop of PROPS)
        styles[prop] = normValue(prop, cs.getPropertyValue(prop));
      const r = el.getBoundingClientRect();
      const entry: Entry = {
        path: p,
        cls: el.getAttribute('class') || '',
        testid: el.getAttribute('data-testid') || undefined,
        rect: [r.x, r.y, r.width, r.height].map((v) => Math.round(v)),
        styles
      };
      if (el.children.length === 0) {
        const t = (el.textContent || '').trim();
        if (t) entry.text = t.slice(0, 80);
      }
      const before = getComputedStyle(el, '::before').content;
      const after = getComputedStyle(el, '::after').content;
      if (before !== 'none') entry.before = before;
      if (after !== 'none') entry.after = after;
      result.push(entry);
      for (const child of Array.from(el.children)) build(child, p);
    };
    build(document.documentElement, '');
    return result;
  }, STYLE_PROPS);
};

const hoverAndFocusProbes = async (page: import('@playwright/test').Page) => {
  const probes: Array<{
    path: string;
    tag: string;
    text: string;
    rest: Record<string, string>;
    hover?: Record<string, string>;
    focus?: Record<string, string>;
  }> = [];
  const handles = await page
    .locator('a[href], button, input, textarea, select, [role="button"]')
    .elementHandles();
  let probed = 0;
  for (const h of handles) {
    if (probed >= 18) break;
    try {
      const meta = await h.evaluate((el: Element) => {
        const rect = el.getBoundingClientRect();
        const visible =
          rect.width > 0 &&
          rect.height > 0 &&
          getComputedStyle(el).visibility !== 'hidden';
        const parts: string[] = [];
        let n: Element | null = el;
        while (n) {
          let idx = 1;
          let sib: Element | null = n;
          while ((sib = sib.previousElementSibling)) {
            if (sib.tagName === n.tagName) idx++;
          }
          parts.unshift(n.tagName.toLowerCase() + (idx > 1 ? `[${idx}]` : ''));
          n = n.parentElement;
        }
        return {
          visible,
          path: parts.join('>'),
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 40)
        };
      });
      if (!meta.visible) continue;
      const grab = (props: string[]) =>
        h.evaluate((el: Element, ps: string[]) => {
          const ctx = document.createElement('canvas').getContext('2d')!;
          const normColor = (v: string) => {
            ctx.fillStyle = '#010203';
            try {
              ctx.fillStyle = v;
            } catch {
              return v;
            }
            return ctx.fillStyle as string;
          };
          const colorFnRe =
            /(?:oklch|oklab|lch|lab|hsl|hsla|rgb|rgba|hwb|color-mix|color)\((?:[^()]|\([^()]*\))*\)/g;
          const cs = getComputedStyle(el);
          const out: Record<string, string> = {};
          for (const p of ps) {
            let v = cs.getPropertyValue(p);
            if (v && (p === 'color' || p.endsWith('-color'))) v = normColor(v);
            else if (v && colorFnRe.test(v)) {
              colorFnRe.lastIndex = 0;
              v = v.replace(colorFnRe, (m) => normColor(m));
            }
            out[p] = v;
          }
          return out;
        }, props);
      const rest = await grab(HOVER_PROPS);
      await h.hover({ timeout: 2000 });
      await page.waitForTimeout(250);
      const hover = await grab(HOVER_PROPS);
      let focus: Record<string, string> | undefined;
      if (['input', 'textarea', 'select', 'button'].includes(meta.tag)) {
        await h.evaluate((el) => (el as HTMLElement).focus());
        await page.waitForTimeout(150);
        focus = await grab(HOVER_PROPS);
        await h.evaluate((el) => (el as HTMLElement).blur());
      }
      probes.push({ ...meta, rest, hover, focus });
      probed++;
    } catch {
      // covered/detached elements: skip
    }
  }
  await page.mouse.move(0, 0);
  return probes;
};

const settle = async (page: import('@playwright/test').Page) => {
  await page.evaluate(async () => {
    const timeout = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // next/image emits loading="lazy" for below-fold images; they never load
    // without scrolling, so force them eager and scroll through the page,
    // then wait (bounded) for completion. Without the 6s bound, a stalled
    // image hangs the run forever.
    for (const img of Array.from(document.images)) img.loading = 'eager';
    window.scrollTo(0, document.body.scrollHeight);
    await timeout(300);
    window.scrollTo(0, 0);
    await Promise.race([
      (async () => {
        await (document as unknown as { fonts: { ready: Promise<unknown> } })
          .fonts.ready;
        await Promise.all(
          Array.from(document.images)
            .filter((i) => !i.complete)
            .map(
              (i) =>
                new Promise((resolve) => {
                  i.onload = i.onerror = resolve;
                })
            )
        );
      })(),
      timeout(6000)
    ]);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
};

const captureOne = async (
  page: import('@playwright/test').Page,
  baseUrl: string,
  server: 'base' | 'head',
  slug: string,
  urlPath: string,
  withProbes: boolean
) => {
  await page.goto(baseUrl + urlPath, { waitUntil: 'load', timeout: 45000 });
  try {
    await settle(page);
  } catch {
    // Client-side redirect (e.g. /ticket → /ticket/[ticketObject]) destroyed
    // the evaluate context; wait for the new document and settle again.
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000);
    await settle(page);
  }
  const elements = await captureSnapshot(page);
  const probes = withProbes ? await hoverAndFocusProbes(page) : [];
  await page.addStyleTag({
    content:
      '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }'
  });
  await page.screenshot({
    path: path.join(OUT, `${slug}.${server}.png`),
    fullPage: true
  });
  fs.writeFileSync(
    path.join(OUT, `${slug}.${server}.json`),
    JSON.stringify({ slug, urlPath, server, elements, probes })
  );
};

const capturePair = async (
  page: import('@playwright/test').Page,
  slug: string,
  urlPath: string,
  withProbes = true
) => {
  await captureOne(page, BASE, 'base', slug, urlPath, withProbes);
  await captureOne(page, HEAD, 'head', slug, urlPath, withProbes);
};

test.beforeAll(() => {
  if (OUT) fs.mkdirSync(OUT, { recursive: true });
});

test.describe('visual comparison', () => {
  test.skip(!OUT, 'VC_OUT not set — run via the visual-compare skill (setup.sh prints the command)');
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(20 * 60 * 1000);

  test('public pages A', async ({ page }) => {
    await capturePair(page, 'home', '/');
    await capturePair(page, 'about-us', '/about-us');
    await capturePair(page, 'our-team', '/our-team');
    await capturePair(page, 'media', '/media');
    await capturePair(page, 'full-agenda', '/full-agenda');
    await capturePair(page, 'panel-labview-python', '/panels/labview-and-python');
    await capturePair(page, 'panel-open-source', '/panels/open-source');
  });

  test('public pages B', async ({ page }) => {
    await capturePair(page, 'presentation-list-2024', '/presentation-list/2024');
    await capturePair(page, 'presenter-list-2024', '/presenter-list/2024');
    await capturePair(page, 'presentation-list-2025', '/presentation-list/2025');
    await capturePair(page, 'presentation-detail', `/presentations/${PRESENTATION_ID}`);
    await capturePair(page, 'presenter-detail', `/presenters/${PRESENTER_ID}`);
    await capturePair(page, 'auth-login', '/auth/login');
    await capturePair(page, 'auth-register', '/auth/register');
    await capturePair(page, 'login-required', '/login-required');
    await capturePair(page, 'access-denied', '/access-denied');
    await capturePair(page, 'auth-blocked', '/auth-blocked');
    await capturePair(page, 'copresenter-invite', '/copresenter-invite/dummy-token');
  });

  test('presenter pages', async ({ browser }) => {
    let handle: SeededUser | undefined;
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      handle = await createPresenter({ emailPrefix: 'visual-compare-presenter' });
      // Log in once on the base server; localhost cookies ignore ports, so the
      // same context is authenticated on both servers.
      await page.goto(BASE + '/');
      await loginOnPage(page, handle.email);

      await capturePair(page, 'my-presentations', '/my-presentations');
      await capturePair(
        page,
        'my-presentations-edit',
        `/my-presentations/edit/${handle.presentationId}`
      );
      await capturePair(page, 'my-profile', '/my-profile');
      await capturePair(page, 'ticket', '/ticket');

      // User-menu popout: open it on both servers and capture viewport
      // screenshots + a snapshot with it open.
      for (const [server, url] of [
        ['base', BASE],
        ['head', HEAD]
      ] as const) {
        await page.goto(url + '/', { waitUntil: 'load' });
        await settle(page);
        await page.locator('[data-testid="user-menu-button"]').click();
        await page.waitForTimeout(400);
        const elements = await captureSnapshot(page);
        fs.writeFileSync(
          path.join(OUT, `home-usermenu.${server}.json`),
          JSON.stringify({
            slug: 'home-usermenu',
            urlPath: '/',
            server,
            elements,
            probes: []
          })
        );
        await page.screenshot({
          path: path.join(OUT, `home-usermenu.${server}.png`)
        });
      }
    } finally {
      await context.close();
      await handle?.cleanup();
    }
  });

  test('organizer pages', async ({ browser }) => {
    let handle: SeededUser | undefined;
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      handle = await createOrganizer({ emailPrefix: 'visual-compare-organizer' });
      await page.goto(BASE + '/');
      await loginOnPage(page, handle.email);
      await capturePair(page, 'review-submissions', '/review-submissions');
    } finally {
      await context.close();
      await handle?.cleanup();
    }
  });

  test('log viewer pages', async ({ browser }) => {
    let handle: SeededUser | undefined;
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      handle = await createLogViewer({ emailPrefix: 'visual-compare-logs' });
      await page.goto(BASE + '/');
      await loginOnPage(page, handle.email);
      await capturePair(page, 'logs', '/logs');
    } finally {
      await context.close();
      await handle?.cleanup();
    }
  });
});
