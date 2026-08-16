/* Pixel + computed-style audit.
 *
 *   node scripts/audit/audit.mjs capture <dir>    write a baseline
 *   node scripts/audit/audit.mjs compare <dir>    check the running build
 *
 * Point it at a production build (`next build && next start -p 3101`); dev
 * builds differ enough to be noise. Needs playwright, pngjs and pixelmatch —
 * see scripts/audit/README.md.
 *
 * Two things that look fussy and are not:
 *
 *  - reducedMotion. The hero's town name is typed and deleted on a setTimeout
 *    chain, so its height is 17.59px or 0 depending purely on when the
 *    screenshot lands, and two of 28 views used to disagree with themselves.
 *    useTypewriter already bails out under prefers-reduced-motion, so this
 *    freezes it through the site's own accessibility path.
 *
 *  - skipping <script>/<style>. They have no box, and counting them made an
 *    extra bundler chunk read as a 21-view regression when nothing had moved.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [, , mode, dir = "baseline"] = process.argv;
if (!["capture", "compare"].includes(mode)) {
  console.error("usage: audit.mjs capture|compare <dir>");
  process.exit(2);
}
const APP = process.env.APP || "http://localhost:3101";
const WIDTHS = [1440, 1280, 1024, 900, 720, 480, 360];
const PAGES = [
  ["home", "/"],
  ["epsom", "/laundry-service-epsom"],
  ["terms", "/terms"],
  ["book", "/book/address"],
];

const PROPS = [
  "display", "position", "width", "height",
  "marginTop", "marginRight", "marginBottom", "marginLeft",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontSize", "fontWeight", "lineHeight", "letterSpacing",
  "color", "backgroundColor", "borderTopWidth", "borderBottomWidth",
  "borderRadius", "gap", "flexDirection", "justifyContent", "alignItems",
  "textAlign", "opacity", "zIndex",
];

mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
let diffs = 0;

for (const [name, path] of PAGES) {
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`${APP}${path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.addStyleTag({
      content: "*,*::before,*::after{animation:none!important;transition:none!important}",
    });
    await page.waitForTimeout(150);

    const key = `${name}-${w}`;
    const styles = await page.evaluate((props) => {
      const out = {};
      const SKIP = new Set(["SCRIPT", "STYLE", "LINK", "TEMPLATE", "NOSCRIPT"]);
      const walk = (el, trail) => {
        const cs = getComputedStyle(el);
        const rec = {};
        for (const p of props) rec[p] = cs[p];
        const r = el.getBoundingClientRect();
        rec._box = `${Math.round(r.width * 100) / 100}x${Math.round(r.height * 100) / 100}`;
        out[trail] = rec;
        [...el.children]
          .filter((c) => !SKIP.has(c.tagName))
          .forEach((c, i) => walk(c, `${trail}/${c.tagName.toLowerCase()}[${i}]`));
      };
      walk(document.body, "body");
      return out;
    }, PROPS);

    const pageH = await page.evaluate(() => document.body.scrollHeight);
    const shot = await page.screenshot({ fullPage: false });

    if (mode === "capture") {
      writeFileSync(`${dir}/${key}.json`, JSON.stringify({ pageH, styles }));
      writeFileSync(`${dir}/${key}.png`, shot);
      console.log(`  captured ${key}  nodes=${Object.keys(styles).length} h=${pageH}`);
      continue;
    }

    if (!existsSync(`${dir}/${key}.json`)) {
      console.log(`  ${key}  SKIP (no baseline)`);
      continue;
    }
    const ref = JSON.parse(readFileSync(`${dir}/${key}.json`, "utf8"));
    const problems = [];
    if (ref.pageH !== pageH) problems.push(`page height ${ref.pageH} -> ${pageH}`);
    const refKeys = Object.keys(ref.styles);
    if (refKeys.length !== Object.keys(styles).length) {
      problems.push(`node count ${refKeys.length} -> ${Object.keys(styles).length}`);
    }
    let n = 0;
    for (const k of refKeys) {
      const a = ref.styles[k], b = styles[k];
      if (!b) { n += 1; continue; }
      for (const p of Object.keys(a)) {
        if (a[p] !== b[p]) { if (n < 6) problems.push(`${k} ${p}: ${a[p]} -> ${b[p]}`); n += 1; }
      }
    }
    if (n > 6) problems.push(`…and ${n - 6} more property diffs`);

    let pct = 0;
    const refPng = PNG.sync.read(readFileSync(`${dir}/${key}.png`));
    const nowPng = PNG.sync.read(shot);
    if (refPng.width === nowPng.width && refPng.height === nowPng.height) {
      const out = new PNG({ width: refPng.width, height: refPng.height });
      const bad = pixelmatch(refPng.data, nowPng.data, out.data, refPng.width, refPng.height, {
        threshold: 0.1,
      });
      pct = (bad / (refPng.width * refPng.height)) * 100;
      if (pct > 0.02) {
        problems.push(`pixels ${pct.toFixed(3)}%`);
        writeFileSync(`${dir}/${key}.diff.png`, PNG.sync.write(out));
      }
    } else {
      problems.push(`size ${refPng.width}x${refPng.height} -> ${nowPng.width}x${nowPng.height}`);
    }

    const ok = problems.length === 0;
    if (!ok) diffs += 1;
    console.log(
      `  ${key.padEnd(14)} ${ok ? "ok" : "DIFF"}  ${ok ? `${pct.toFixed(3)}%` : problems.slice(0, 4).join(" | ")}`,
    );
  }
}

await browser.close();
console.log(
  mode === "capture"
    ? `\nbaseline written to ${dir}/`
    : diffs
      ? `\n${diffs} view(s) differ`
      : "\nidentical to baseline",
);
process.exit(mode === "compare" && diffs ? 1 : 0);
