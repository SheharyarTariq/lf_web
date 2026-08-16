/* The states audit.mjs cannot reach.
 *
 *   node scripts/audit/deep.mjs capture <dir>
 *   node scripts/audit/deep.mjs compare <dir>
 *
 * audit.mjs stops at resting pages, which proves nothing about the auth
 * modal, the later checkout screens, or any conditional recipe — a selected
 * calendar day, a chosen slot, an open accordion. Those are exactly where a
 * class-composition change can go wrong, so they are driven here.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [, , mode, dir = "deep"] = process.argv;
const APP = process.env.APP || "http://localhost:3101";
const WIDTHS = [1280, 720, 390];
const PROPS = [
  "display", "width", "height", "marginTop", "marginBottom",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontSize", "fontWeight", "lineHeight", "letterSpacing",
  "color", "backgroundColor", "borderTopWidth", "borderRadius", "gap",
  "justifyContent", "alignItems", "opacity",
];

mkdirSync(dir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ reducedMotion: "reduce" });
const page = await context.newPage();
let diffs = 0;

const snap = async (key) => {
  await page.waitForTimeout(500);
  await page.addStyleTag({
    content: "*,*::before,*::after{animation:none!important;transition:none!important}",
  });
  await page.waitForTimeout(120);
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
  const shot = await page.screenshot({ fullPage: false });

  if (mode === "capture") {
    writeFileSync(`${dir}/${key}.json`, JSON.stringify(styles));
    writeFileSync(`${dir}/${key}.png`, shot);
    console.log(`  captured ${key}  nodes=${Object.keys(styles).length}`);
    return;
  }
  if (!existsSync(`${dir}/${key}.json`)) return console.log(`  ${key} SKIP`);
  const ref = JSON.parse(readFileSync(`${dir}/${key}.json`, "utf8"));
  const problems = [];
  const rk = Object.keys(ref);
  if (rk.length !== Object.keys(styles).length) {
    problems.push(`nodes ${rk.length} -> ${Object.keys(styles).length}`);
  }
  let n = 0;
  for (const k of rk) {
    const a = ref[k], b = styles[k];
    if (!b) { n += 1; continue; }
    for (const p of Object.keys(a)) {
      if (a[p] !== b[p]) { if (n < 5) problems.push(`${k} ${p}: ${a[p]} -> ${b[p]}`); n += 1; }
    }
  }
  if (n > 5) problems.push(`+${n - 5} more`);
  const rp = PNG.sync.read(readFileSync(`${dir}/${key}.png`));
  const np = PNG.sync.read(shot);
  let pct = 0;
  if (rp.width === np.width && rp.height === np.height) {
    const out = new PNG({ width: rp.width, height: rp.height });
    const bad = pixelmatch(rp.data, np.data, out.data, rp.width, rp.height, { threshold: 0.1 });
    pct = (bad / (rp.width * rp.height)) * 100;
    if (pct > 0.02) {
      problems.push(`pixels ${pct.toFixed(3)}%`);
      writeFileSync(`${dir}/${key}.diff.png`, PNG.sync.write(out));
    }
  } else problems.push(`size ${rp.width}x${rp.height} -> ${np.width}x${np.height}`);
  const ok = !problems.length;
  if (!ok) diffs += 1;
  console.log(
    `  ${key.padEnd(20)} ${ok ? "ok" : "DIFF"}  ${ok ? `${pct.toFixed(3)}%` : problems.slice(0, 3).join(" | ")}`,
  );
};

for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });

  await page.goto(APP, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Log in" }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  await snap(`authlogin-${w}`);
  await page.getByRole("dialog").getByRole("button", { name: "Sign up" }).click();
  await page.waitForTimeout(300);
  await snap(`authsignup-${w}`);

  /* The flow guard sends you back to the furthest step your data allows, so
     the checkout has to be filled in rather than deep-linked. */
  await page.goto(`${APP}/book/address`, { waitUntil: "networkidle" });
  await page.locator('input[autocomplete="postal-code"]').fill("KT227HH");
  await page.getByRole("button", { name: "Find address" }).click();
  await page.waitForTimeout(400);
  await snap(`bookresults-${w}`);
  await page.locator("ul li button").first().click();
  await page.waitForTimeout(400);
  await snap(`bookaddress2-${w}`);
  await page.getByRole("button", { name: /Continue to times/i }).click();
  await page.waitForTimeout(700);
  await snap(`booktime-${w}`);

  const day = page.locator("[data-k]:not([disabled])").first();
  if (await day.count()) {
    await day.click();
    await page.waitForTimeout(500);
    await snap(`bookday-on-${w}`);
    const slot = page.locator('label:has(input[type="radio"])').first();
    if (await slot.count()) {
      await slot.click();
      await page.waitForTimeout(400);
      await snap(`bookslot-on-${w}`);
    }
  }

  await page.goto(`${APP}/#faq`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const q = page.locator("#faq button[aria-expanded]").first();
  if (await q.count()) {
    await q.click();
    await page.waitForTimeout(400);
    await snap(`faqopen-${w}`);
  }
}

await browser.close();
console.log(
  mode === "capture"
    ? `\ndeep baseline written to ${dir}/`
    : diffs
      ? `\n${diffs} view(s) differ`
      : "\nidentical to deep baseline",
);
process.exit(mode === "compare" && diffs ? 1 : 0);
