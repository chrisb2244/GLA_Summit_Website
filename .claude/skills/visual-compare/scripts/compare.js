// Diffs the base/head captures produced by the visual-compare capture spec and
// writes report.md + report.json + per-page pixel-diff images into the run dir.
//
// Usage: node compare.js <run-dir>
//   <run-dir> must contain compare/ with <slug>.{base,head}.{json,png} pairs
//   and (optionally) meta.json written by setup.sh.
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const runDir = process.argv[2];
if (!runDir || !fs.existsSync(path.join(runDir, 'compare'))) {
  console.error('usage: node compare.js <run-dir>   (run dir must contain compare/)');
  process.exit(1);
}
const OUT = path.join(runDir, 'compare');

let meta = {};
try {
  meta = JSON.parse(fs.readFileSync(path.join(runDir, 'meta.json')));
} catch {
  /* optional */
}
const baseLabel = meta.baseRef
  ? `${meta.baseRef} (${(meta.baseHash || '').slice(0, 7)})`
  : 'base';
const headLabel = meta.headRef
  ? `${meta.headRef} (${(meta.headHash || '').slice(0, 7)})`
  : 'head';

const slugs = [
  ...new Set(
    fs
      .readdirSync(OUT)
      .filter((f) => f.endsWith('.base.json'))
      .map((f) => f.replace('.base.json', ''))
  )
].sort();

const report = { meta, pages: {}, styleGroups: {}, probeDiffs: [], pixel: {} };

// ── Equivalence helpers ─────────────────────────────────────────────────────
// Colors within 5 RGB units per channel are flagged "palette": framework
// palette re-derivations (e.g. Tailwind v4's OKLCH conversion) move every
// default color by a couple of units — visually indistinguishable. Also
// normalize serialization-only differences (transparent shadow layers, font
// quoting).
const parseColor = (s) => {
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m)
    return [
      parseInt(m[1].slice(0, 2), 16),
      parseInt(m[1].slice(2, 4), 16),
      parseInt(m[1].slice(4, 6), 16),
      255
    ];
  m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(s);
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 255 : +m[4] * 255];
  return null;
};
const colorsClose = (a, b) => {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return false;
  return Math.max(...ca.map((v, i) => Math.abs(v - cb[i]))) <= 5;
};
const normalizeVal = (prop, v) => {
  if (v === undefined || v === null) return v;
  if (prop === 'box-shadow') {
    return v
      .split(/,(?![^(]*\))/)
      .map((s) => s.trim())
      .filter((s) => !/^rgba\(0, 0, 0, 0\) 0px 0px 0px 0px$/.test(s))
      .join(', ');
  }
  if (prop === 'font-family') return v.replace(/"/g, '');
  return v;
};

const label = (e) => {
  const tail = e.path.split('>').slice(-2).join('>');
  const bits = [tail];
  if (e.testid) bits.push(`[data-testid=${e.testid}]`);
  if (e.text) bits.push(`"${e.text.slice(0, 30)}"`);
  return bits.join(' ');
};

for (const slug of slugs) {
  const b = JSON.parse(fs.readFileSync(path.join(OUT, `${slug}.base.json`)));
  const h = JSON.parse(fs.readFileSync(path.join(OUT, `${slug}.head.json`)));
  const bMap = new Map(b.elements.map((e) => [e.path, e]));
  const hMap = new Map(h.elements.map((e) => [e.path, e]));

  const page = {
    structuralRemoved: [],
    structuralAdded: [],
    styleDiffs: [],
    rectDiffs: [],
    textDiffs: [],
    pseudoDiffs: []
  };

  // Top-most structural differences only.
  const topMost = (paths, set) =>
    paths.filter((p) => {
      const parent = p.slice(0, p.lastIndexOf('>'));
      return !set.has(parent);
    });
  const removedSet = new Set([...bMap.keys()].filter((p) => !hMap.has(p)));
  const addedSet = new Set([...hMap.keys()].filter((p) => !bMap.has(p)));
  page.structuralRemoved = topMost([...removedSet], removedSet).map((p) =>
    label(bMap.get(p))
  );
  page.structuralAdded = topMost([...addedSet], addedSet).map((p) =>
    label(hMap.get(p))
  );

  for (const [p, be] of bMap) {
    const he = hMap.get(p);
    if (!he) continue;
    const colorChange = be.styles['color'] !== he.styles['color'];
    for (const prop of Object.keys(be.styles)) {
      const a = normalizeVal(prop, be.styles[prop]);
      const z = normalizeVal(prop, he.styles[prop]);
      if (a === z) continue;
      // text-decoration-color / outline-color are currentColor: skip when they
      // just mirror the element's color change.
      if (
        (prop === 'text-decoration-color' || prop === 'outline-color') &&
        colorChange &&
        be.styles[prop] === be.styles['color'] &&
        he.styles[prop] === he.styles['color']
      )
        continue;
      // ignore sub-pixel numeric noise
      const na = parseFloat(a);
      const nz = parseFloat(z);
      if (
        !Number.isNaN(na) &&
        !Number.isNaN(nz) &&
        String(na) + 'px' === a &&
        String(nz) + 'px' === z &&
        Math.abs(na - nz) < 0.5
      )
        continue;
      const palette = colorsClose(a, z);
      page.styleDiffs.push({ path: p, el: label(be), prop, base: a, head: z, palette });
      const key = `${prop} :: ${a} → ${z}`;
      report.styleGroups[key] = report.styleGroups[key] || {
        prop,
        base: a,
        head: z,
        palette,
        count: 0,
        pages: {},
        samples: []
      };
      const g = report.styleGroups[key];
      g.count++;
      g.pages[slug] = (g.pages[slug] || 0) + 1;
      if (g.samples.length < 3) g.samples.push(`${slug}: ${label(be)}`);
    }
    const [bx, by, bw, bh] = be.rect;
    const [hx, hy, hw, hh] = he.rect;
    if (
      Math.abs(bx - hx) > 1 ||
      Math.abs(by - hy) > 1 ||
      Math.abs(bw - hw) > 1 ||
      Math.abs(bh - hh) > 1
    ) {
      page.rectDiffs.push({
        el: label(be),
        base: be.rect,
        head: he.rect
      });
    }
    if ((be.text || '') !== (he.text || '')) {
      page.textDiffs.push({ el: label(be), base: be.text, head: he.text });
    }
    if ((be.before || 'none') !== (he.before || 'none') || (be.after || 'none') !== (he.after || 'none')) {
      page.pseudoDiffs.push({
        el: label(be),
        base: { before: be.before, after: be.after },
        head: { before: he.before, after: he.after }
      });
    }
  }

  // Hover / focus probe deltas.
  const bProbes = new Map((b.probes || []).map((p) => [p.path, p]));
  for (const hp of h.probes || []) {
    const bp = bProbes.get(hp.path);
    if (!bp) continue;
    for (const kind of ['hover', 'focus']) {
      if (!bp[kind] && !hp[kind]) continue;
      const delta = (probe) => {
        const d = {};
        if (!probe[kind]) return d;
        for (const prop of Object.keys(probe.rest)) {
          if (probe.rest[prop] !== probe[kind][prop])
            d[prop] = `${probe.rest[prop]} → ${probe[kind][prop]}`;
        }
        return d;
      };
      const bd = delta(bp);
      const hd = delta(hp);
      const props = new Set([...Object.keys(bd), ...Object.keys(hd)]);
      for (const prop of props) {
        if (bd[prop] !== hd[prop]) {
          report.probeDiffs.push({
            slug,
            el: `${hp.tag} "${hp.text}"`,
            kind,
            prop,
            base: bd[prop] || '(no change on ' + kind + ')',
            head: hd[prop] || '(no change on ' + kind + ')'
          });
        }
      }
    }
  }

  // Pixel diff.
  try {
    const imgA = PNG.sync.read(fs.readFileSync(path.join(OUT, `${slug}.base.png`)));
    const imgB = PNG.sync.read(fs.readFileSync(path.join(OUT, `${slug}.head.png`)));
    const w = Math.max(imgA.width, imgB.width);
    const ht = Math.max(imgA.height, imgB.height);
    const pad = (img) => {
      if (img.width === w && img.height === ht) return img;
      const out = new PNG({ width: w, height: ht, fill: true });
      PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
      return out;
    };
    const a = pad(imgA);
    const z = pad(imgB);
    const diff = new PNG({ width: w, height: ht });
    const n = pixelmatch(a.data, z.data, diff.data, w, ht, { threshold: 0.08 });
    fs.writeFileSync(path.join(OUT, `${slug}.diff.png`), PNG.sync.write(diff));
    report.pixel[slug] = {
      changedPx: n,
      pct: +((100 * n) / (w * ht)).toFixed(2),
      heightBase: imgA.height,
      heightHead: imgB.height
    };
  } catch (e) {
    report.pixel[slug] = { error: e.message };
  }

  report.pages[slug] = page;
}

fs.writeFileSync(path.join(runDir, 'report.json'), JSON.stringify(report, null, 1));

// ── Markdown summary ──
let md = `# Rendered differences — ${headLabel} vs ${baseLabel}\n\n`;

const groups = Object.values(report.styleGroups).sort((a, b) => b.count - a.count);
const emitGroups = (list) => {
  let s = `| Property | base | head | # els | Pages | Sample |\n|---|---|---|---|---|---|\n`;
  for (const g of list) {
    const pages = Object.entries(g.pages)
      .map(([s2, c]) => `${s2}(${c})`)
      .join(', ');
    s += `| ${g.prop} | \`${g.base}\` | \`${g.head}\` | ${g.count} | ${pages.slice(0, 140)} | ${g.samples[0]} |\n`;
  }
  return s;
};

md += '## Real style changes (grouped across all pages)\n\n';
md += emitGroups(groups.filter((g) => !g.palette));

md +=
  '\n## Near-identical color shifts (≤5 RGB units per channel; typically framework palette re-derivation)\n\n';
md += emitGroups(groups.filter((g) => g.palette));

md += '\n## Hover/focus behavioural differences\n\n';
if (!report.probeDiffs.length) md += '_None detected._\n';
for (const d of report.probeDiffs) {
  md += `- **${d.slug}** ${d.el} on ${d.kind}: \`${d.prop}\` base: ${d.base} | head: ${d.head}\n`;
}

md += '\n## Structural (DOM) differences\n\n';
for (const [slug, p] of Object.entries(report.pages)) {
  if (!p.structuralAdded.length && !p.structuralRemoved.length) continue;
  md += `- **${slug}**: removed ${JSON.stringify(p.structuralRemoved)}, added ${JSON.stringify(p.structuralAdded)}\n`;
}

md += '\n## Text differences\n\n';
for (const [slug, p] of Object.entries(report.pages)) {
  for (const t of p.textDiffs) md += `- **${slug}** ${t.el}: "${t.base}" → "${t.head}"\n`;
}

md += '\n## Pseudo-element differences\n\n';
for (const [slug, p] of Object.entries(report.pages)) {
  for (const t of p.pseudoDiffs)
    md += `- **${slug}** ${t.el}: ${JSON.stringify(t.base)} → ${JSON.stringify(t.head)}\n`;
}

md += '\n## Geometry shifts & pixel diff per page\n\n';
md += `| Page | elements moved/resized | first shifted element | px changed | % | height base→head |\n|---|---|---|---|---|---|\n`;
for (const slug of slugs) {
  const p = report.pages[slug];
  const px = report.pixel[slug] || {};
  const first = p.rectDiffs[0]
    ? `${p.rectDiffs[0].el} ${JSON.stringify(p.rectDiffs[0].base)}→${JSON.stringify(p.rectDiffs[0].head)}`
    : '';
  md += `| ${slug} | ${p.rectDiffs.length} | ${first.slice(0, 90)} | ${px.changedPx ?? px.error} | ${px.pct ?? ''} | ${px.heightBase ?? ''}→${px.heightHead ?? ''} |\n`;
}

fs.writeFileSync(path.join(runDir, 'report.md'), md);
console.log('slugs:', slugs.length, 'styleGroups:', groups.length, 'probeDiffs:', report.probeDiffs.length);
