#!/usr/bin/env node
// mirror-site.mjs — mirror the full set of deployed assets of a "static-built site" (Astro / Vite SSG / Hugo etc.) for a 1:1 faithful clone.
// Principle: the "real source" of these sites is not on GitHub, but the deployed static assets (HTML + bundle + CSS + runtime-fetched
//       .sog/.buf/.wasm/.riv/fonts/images) ARE the truth. Load in a real browser, scroll start to finish, capture every real request, mirror same-origin assets by path.
// Usage:
//   node scripts/mirror-site.mjs --url <URL> --out <dir> [--scroll-step 700] [--settle 2500] [--max-ms 90000]
// Outputs:
//   <dir>/site/...                mirrored same-origin assets (paths preserved; directory URLs stored as index.html)
//   <dir>/mirror-manifest.json    all requests (same-origin + third-party) + per-item status
//   <dir>/own-asset-urls.txt      same-origin asset path list
//   <dir>/third-party.json        third-party hosts + webfont CSS needing self-hosting (typekit/google) hints
// Discipline: only mirror assets that were ACTUALLY requested; never invent paths. Third-party CDNs (fonts/wasm/video) are not auto-rewritten — handle per third-party.json.
//       Manual follow-up: self-host domain-locked fonts (typically Typekit @import) → rewrite CSS @import to local → strip tracking → serve site/ as web root.
//       Full recipe in references/static-mirror.md.

import { loadPlaywright, launchChromium } from "./lib/playwright-loader.mjs";
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const o = { url: "", out: "", scrollStep: 700, settle: 2500, maxMs: 90000, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") o.help = true;
    else if (a === "--url") o.url = argv[++i] || "";
    else if (a === "--out") o.out = argv[++i] || "";
    else if (a === "--scroll-step") o.scrollStep = parseInt(argv[++i] || "700", 10);
    else if (a === "--settle") o.settle = parseInt(argv[++i] || "2500", 10);
    else if (a === "--max-ms") o.maxMs = parseInt(argv[++i] || "90000", 10);
  }
  return o;
}

function usage() {
  console.log(`mirror-site.mjs — Full asset mirror for static-built sites (1:1 faithful clone)

  node scripts/mirror-site.mjs --url <URL> --out <dir> [--scroll-step 700] [--settle 2500] [--max-ms 90000]

Applies to: Astro / Vite SSG / Hugo / any site whose client runtime ships as downloadable static assets (incl. WebGL/Canvas heavy frontends).
Does not apply to: true server-rendered / data-driven SPAs (use network-capture.mjs for API stand-ins).
Recipe and follow-up rewrite steps (self-host fonts / strip tracking / serve) → references/static-mirror.md`);
}

// same-origin asset URL → local relative path (query stripped; directory URLs stored as index.html)
function urlToLocalPath(u, origin) {
  let p = u.slice(origin.length);
  const q = p.indexOf("?");
  if (q >= 0) p = p.slice(0, q);
  if (p === "" || p.endsWith("/")) p += "index.html";
  return p.replace(/^\/+/, "");
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.url || !args.out) {
  usage();
  process.exit(args.help ? 0 : 1);
}

const origin = new URL(args.url).origin;
const siteDir = path.join(path.resolve(args.out), "site");
fs.mkdirSync(siteDir, { recursive: true });

const responses = new Map(); // url -> {status, type, ct}
const pw = loadPlaywright();
const browser = await launchChromium(pw.chromium);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on("response", (resp) => {
  try {
    const h = resp.headers();
    responses.set(resp.url(), { status: resp.status(), type: resp.request().resourceType(), ct: h["content-type"] || "" });
  } catch {}
});

console.log(`▸ Load + full-scroll capture: ${args.url}`);
await page.goto(args.url, { waitUntil: "networkidle", timeout: args.maxMs }).catch((e) => console.warn("  goto:", e.message));
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y <= total; y += args.scrollStep) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(180);
}
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(args.settle);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);

const all = [...responses.entries()].map(([url, m]) => ({ url, ...m }));
const ownUrls = all.filter((r) => r.url.startsWith(origin + "/") || r.url === origin || r.url === origin + "/");

console.log(`▸ Captured ${all.length} requests; ${ownUrls.length} same-origin, downloading…`);
let ok = 0, fail = 0;
const failed = [];
for (const r of ownUrls) {
  const rel = urlToLocalPath(r.url, origin);
  const dest = path.join(siteDir, rel);
  try {
    const resp = await ctx.request.get(r.url); // reuse the browser network stack (cookies/TUN/proxy consistent with the page)
    if (!resp.ok()) { fail++; failed.push(`HTTP${resp.status()} ${rel}`); continue; }
    const buf = await resp.body();
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    ok++;
  } catch (e) {
    fail++; failed.push(`${e.message} ${rel}`);
  }
}

// third-party + webfont hints
const thirdHosts = [...new Set(all.filter((r) => !r.url.startsWith(origin)).map((r) => { try { return new URL(r.url).host; } catch { return r.url; } }))];
const webfontCss = all.map((r) => r.url).filter((u) => /use\.typekit\.net\/[a-z0-9]+\.css|fonts\.googleapis\.com\/css/i.test(u));
const outRoot = path.resolve(args.out);
fs.writeFileSync(path.join(outRoot, "mirror-manifest.json"), JSON.stringify(all, null, 2));
fs.writeFileSync(path.join(outRoot, "own-asset-urls.txt"), ownUrls.map((r) => urlToLocalPath(r.url, origin)).sort().join("\n") + "\n");
fs.writeFileSync(path.join(outRoot, "third-party.json"), JSON.stringify({ hosts: thirdHosts, webfont_css_to_selfhost: webfontCss }, null, 2));

console.log(`✅ Mirror complete: ${ok} ok / ${fail} failed → ${siteDir}`);
if (failed.length) console.log("  ⚠️ Failed:\n   " + failed.slice(0, 20).join("\n   "));
console.log(`▸ Third-party hosts: ${thirdHosts.join(", ") || "(none)"}`);
if (webfontCss.length) console.log(`▸ Webfont CSS needing self-hosting (domain-locked, see static-mirror.md): \n   ${webfontCss.join("\n   ")}`);
console.log(`▸ Next: self-host fonts + rewrite CSS @import + strip tracking → cd ${siteDir} && python3 -m http.server 8124`);
await browser.close();
