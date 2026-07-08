// Produces small before/after crops for each FINDINGS item from the full-page
// captures, locating regions via the recorded element rects on each side (so
// crops track layout shifts between base and head).
//
// Usage: node crop.js <run-dir>
//   Reads <run-dir>/crop-items.json (authored per run), writes PNG pairs to
//   <run-dir>/crops/<id>.{base,head}.png.
//
// crop-items.json is an array of items:
// {
//   "id": "1-1",                 // output name prefix
//   "slug": "media",             // page slug from the capture
//   // EITHER locate an element (matched on the base side, rect read per side):
//   "find": {
//     "textIncludes": "...",     // leaf-text substring
//     "pathIncludes": "form",    // structural-path substring
//     "pathEnds": "button",      // structural-path suffix
//     "minRectW": 100,           // minimum element width
//     "prop": "color",           // with from/to: match a specific style change
//     "from": "#111827",         //   base-side computed value (normalized)
//     "to": "#5837b9"            //   head-side computed value
//   },
//   "ancestor": "tr",            // optional: climb to enclosing tag (e.g. row)
//   "opts": { "pad": 40, "padL": 60, "padR": 200, "padT": 40, "padB": 90,
//             "minW": 360, "minH": 110 },
//   "clipLeft": 860,             // optional: hard left edge (px)
//   "clipH": 210,                // optional: cap crop height (px)
//   // OR fixed pixel boxes (required for sticky elements — they render at the
//   // stitched last-viewport position in fullPage screenshots, so rect-based
//   // crops are wrong; give per-side boxes):
//   "fixedBox": { "x": 0, "y": 0, "w": 100, "h": 100 },   // same box both sides
//   "fixedBoxBase": { ... }, "fixedBoxHead": { ... }      // per-side boxes
// }
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const runDir = process.argv[2];
if (!runDir || !fs.existsSync(path.join(runDir, 'crop-items.json'))) {
  console.error('usage: node crop.js <run-dir>   (run dir must contain crop-items.json)');
  process.exit(1);
}
const OUT = path.join(runDir, 'compare');
const CROPS = path.join(runDir, 'crops');
fs.mkdirSync(CROPS, { recursive: true });

const ITEMS = JSON.parse(fs.readFileSync(path.join(runDir, 'crop-items.json')));

const load = (slug, side) =>
  JSON.parse(fs.readFileSync(path.join(OUT, `${slug}.${side}.json`)));

// Find first element matching criteria; style values checked per side pair.
const findPath = (b, h, c) => {
  for (const e of b.elements) {
    if (c.textIncludes && !(e.text || '').includes(c.textIncludes)) continue;
    if (c.minRectW && e.rect[2] < c.minRectW) continue;
    if (c.pathEnds && !e.path.endsWith(c.pathEnds)) continue;
    if (c.pathIncludes && !e.path.includes(c.pathIncludes)) continue;
    if (c.prop) {
      const he = h.elements.find((x) => x.path === e.path);
      if (!he) continue;
      if (c.from !== undefined && e.styles[c.prop] !== c.from) continue;
      if (c.to !== undefined && he.styles[c.prop] !== c.to) continue;
    }
    return e.path;
  }
  throw new Error('no match: ' + JSON.stringify(c));
};

// Optionally climb to an ancestor tag (e.g. the row containing a cell).
const ancestorPath = (p, tag) => {
  const segs = p.split('>');
  for (let i = segs.length - 1; i >= 0; i--) {
    if (segs[i] === tag || segs[i].startsWith(tag + '[')) {
      return segs.slice(0, i + 1).join('>');
    }
  }
  return p;
};

const rectOf = (snap, p) => {
  const e = snap.elements.find((x) => x.path === p);
  if (!e) throw new Error('path missing on side: ' + p);
  return e.rect;
};

const cropPng = (slug, side, box, outName) => {
  const img = PNG.sync.read(fs.readFileSync(path.join(OUT, `${slug}.${side}.png`)));
  const x = Math.max(0, Math.round(box.x));
  const y = Math.max(0, Math.round(box.y));
  const w = Math.min(img.width - x, Math.round(box.w));
  const h = Math.min(img.height - y, Math.round(box.h));
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(img, out, x, y, w, h, 0, 0);
  fs.writeFileSync(path.join(CROPS, outName), PNG.sync.write(out));
};

const boxFromRect = (r, o) => {
  const padL = o.padL ?? o.pad ?? 40;
  const padR = o.padR ?? o.pad ?? 40;
  const padT = o.padT ?? o.pad ?? 30;
  const padB = o.padB ?? o.pad ?? 30;
  let x = r[0] - padL;
  let y = r[1] - padT;
  let w = r[2] + padL + padR;
  let h = r[3] + padT + padB;
  const minW = o.minW ?? 360;
  const minH = o.minH ?? 110;
  if (w < minW) { x -= (minW - w) / 2; w = minW; }
  if (h < minH) { y -= (minH - h) / 2; h = minH; }
  return { x, y, w, h };
};

let failed = 0;
for (const item of ITEMS) {
  try {
    if (item.fixedBox || item.fixedBoxBase) {
      cropPng(item.slug, 'base', item.fixedBoxBase || item.fixedBox, `${item.id}.base.png`);
      cropPng(item.slug, 'head', item.fixedBoxHead || item.fixedBox, `${item.id}.head.png`);
      console.log(item.id, 'fixed box ok');
      continue;
    }
    const b = load(item.slug, 'base');
    const h = load(item.slug, 'head');
    let p = findPath(b, h, item.find);
    if (item.ancestor) p = ancestorPath(p, item.ancestor);
    for (const [side, snap] of [['base', b], ['head', h]]) {
      const box = boxFromRect(rectOf(snap, p), item.opts || {});
      if (item.clipLeft) { box.w -= item.clipLeft - box.x; box.x = item.clipLeft; }
      if (item.clipH) box.h = Math.min(box.h, item.clipH);
      cropPng(item.slug, side, box, `${item.id}.${side}.png`);
    }
    console.log(item.id, 'ok', p.split('>').slice(-3).join('>'));
  } catch (e) {
    failed++;
    console.log(item.id, 'FAILED:', e.message);
  }
}
if (failed) process.exit(2);
