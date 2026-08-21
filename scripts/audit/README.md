# Visual audit

Two harnesses that answer one question: **did this change move anything on screen that it
was not supposed to?**

They were written during the design port and the skills restructure, and they earned their
keep — they caught the auth modal being silently restyled when its fields were pointed at the
checkout's input recipe, which nothing else would have noticed until someone opened it.

## Running

They need a **production** build. Dev builds differ enough to be noise.

```bash
npm run build
npx next start -p 3101 &

npm i --no-save playwright pngjs pixelmatch    # not project deps; see below

node scripts/audit/audit.mjs capture baseline   # before your change
node scripts/audit/audit.mjs compare baseline   # after
node scripts/audit/deep.mjs   capture deep
node scripts/audit/deep.mjs   compare deep
```

`compare` exits non-zero on any difference, so it drops into CI as-is.

**Finish with `rm -rf .next` before going back to `next dev`.** `next build` and `next dev`
share that directory — dev keeps its own tree under `.next/dev`, but the root still holds the
build's `BUILD_ID`, `routes-manifest.json` and `app-path-routes-manifest.json`, and a dev
server started on top of them can serve **404 for every route but `/`** while the compiled
pages sit on disk right beside the manifest that no longer lists them. It looks like the app
is broken; it is leftover build output. Costs one `rm -rf .next` and a restart.

The three packages are deliberately **not** in `package.json` — playwright pulls a browser
download, and this is tooling rather than something the app needs to build. Install them when
you audit. If this ever runs in CI, move them to `devDependencies` then.

The usual pattern for verifying a change is: `git stash` your work, build, `capture`, restore,
build, `compare`. That gives a genuine before/after rather than comparing against whatever the
baseline happened to be.

## What each one covers

**`audit.mjs`** — 4 pages × 7 widths (1440 → 360). Every element's box and ~28 computed
properties, plus a screenshot. Catches layout drift, colour and type changes, and anything
that moves a box.

**`deep.mjs`** — the states `audit.mjs` cannot reach: the auth modal's login and signup panes,
the address results list, a filled address, the time screen, a **selected** calendar day, a
**selected** slot tile, and an **open** FAQ accordion, at 1280/720/390.

The interactive states are the point of the second file. Resting screens prove nothing about a
conditional class recipe, and conditional recipes are exactly what `cn()` and `tailwind-merge`
changed the resolution order of.

## Two details that look fussy and are not

**`reducedMotion: "reduce"`.** The hero's town name is typed and deleted on a `setTimeout`
chain, so its height is 17.59px or 0 depending purely on when the screenshot lands — two of 28
views used to disagree with *themselves*. `useTypewriter` already freezes on the first word
under `prefers-reduced-motion`, so this makes the run repeatable through the site's own
accessibility path rather than by poking the DOM.

**Skipping `<script>` and `<style>`.** They have no box. Counting them meant that adding `yup`
to the client graph — one extra bundler chunk — reported as a 21-view regression when nothing
had moved.

## Expected differences

The lucide icon swap changed the artwork on purpose. If you are bisecting a diff that starts
at that commit, see `docs/ICONS.md`, which maps every original to its replacement and to the
archived SVG under `public/icons/`.
