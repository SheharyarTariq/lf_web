# Icons — archive and mapping

The design shipped ~30 hand-drawn icons. The `web-best-practices` skill says icons come from
`lucide-react`, so they were swapped — but **every original was written out to `public/icons/`
first**, and this file records where each one went and what replaced it.

**To put one back:** take the `.svg` from `public/icons/`, and either inline its path in the
component or render the file. The archived files carry the exact stroke width, viewBox and
fill the component was rendering with, so opening one shows what used to be on screen. The
path data was read out of the source rather than retyped, so it is the artwork that shipped,
not an approximation.

`public/icons/MANIFEST.json` is the machine-readable version of the tables below.

---

## Not replaced — brand and trademark artwork

Lucide has no equivalent for any of these, and two of them are marks we are contractually
required to render as supplied. They stay exactly as they are.

| Mark | Lives in | Archived |
|---|---|---|
| Full logo lockup (leaf + wordmark) | `components/common/Wordmark/index.tsx` | `public/assets/logo-primary.svg` |
| Leaf mark | Wordmark, favicon | `public/assets/leaf-mark.png` |
| Apple sign-in mark | `components/booking/icons.tsx` `ProviderMark` | — |
| Google sign-in mark | `components/booking/icons.tsx` `ProviderMark` | — |
| App Store badge | `components/icons.tsx` `AppleGlyph` | `public/icons/brand/apple-store-glyph.svg` |
| Play Store badge | `components/icons.tsx` `PlayGlyph` | — |
| Facebook / Instagram | `components/icons.tsx` `SocialGlyph` | `public/icons/brand/facebook.svg` |

**The logo stays inlined rather than loaded from `public/`.** `Wordmark` renders
`fill="currentColor"` so the same lockup is ink in the header and white on the dark footer.
An `<img src="/assets/logo-primary.svg">` cannot inherit colour, so the footer logo would come
out black on black. It is archived either way; it just keeps rendering inline.

---

## Checkout — `components/booking/icons.tsx`, the `P` map

One 20×20 grid, stroked at 1.7. Lucide's grid is 24×24 stroked at 2, so sizes are matched at
the call site rather than by scaling the artwork.

| Name | Archived | Replaced by |
|---|---|---|
| `back` | `public/icons/checkout/back.svg` | `ChevronLeft` |
| `chevron` | `public/icons/checkout/chevron.svg` | `ChevronRight` |
| `tick` | `public/icons/checkout/tick.svg` | `Check` |
| `thumb` | `public/icons/checkout/thumb.svg` | `ThumbsUp` (filled) |
| `info` | `public/icons/checkout/info.svg` | `Info` |
| `alert` | `public/icons/checkout/alert.svg` | `TriangleAlert` |
| `lock` | `public/icons/checkout/lock.svg` | `Lock` |
| `card` | `public/icons/checkout/card.svg` | `CreditCard` |
| `clock` | `public/icons/checkout/clock.svg` | `Clock` |
| `pin` | `public/icons/checkout/pin.svg` | `MapPin` |
| `close` | `public/icons/checkout/close.svg` | `X` |
| `mail` | `public/icons/checkout/mail.svg` | `Mail` |
| `eye` | `public/icons/checkout/eye.svg` | `Eye` |
| `eyeOff` | `public/icons/checkout/eyeOff.svg` | `EyeOff` |
| `bag` | `public/icons/checkout/bag.svg` | `ShoppingBag` |
| `list` | `public/icons/checkout/list.svg` | `List` |
| `repeat` | `public/icons/checkout/repeat.svg` | `Repeat` |
| `spark` | `public/icons/checkout/spark.svg` | `Sparkles` |
| `leaf` | `public/icons/checkout/leaf.svg` | `Leaf` |
| `leafSolid` | `public/icons/checkout/leafSolid.svg` | `Leaf` (filled) |

`thumb` and `leafSolid` are the two filled icons — everything else is stroked. `thumb` is a
single path holding two closed subpaths (cuff, then hand) because at 13px a stroked version
fills in and reads as a smudge.

## Landing — `components/icons.tsx`

| Name | Used by | Archived | Replaced by |
|---|---|---|---|
| `Check` | `GetTheApp`, `Pricing` | `public/icons/landing/check.svg` | `Check` |
| `TrustIcon` `van` | panel trust row | `public/icons/landing/trust-van.svg` | `Truck` |
| `TrustIcon` `tag` | panel trust row | `public/icons/landing/trust-tag.svg` | `Tag` |
| `TrustIcon` `list` | panel trust row | `public/icons/landing/trust-list.svg` | `List` |
| `StepIcon` `bag` | How it works | `public/icons/landing/step-bag.svg` | `ShoppingBag` |
| `StepIcon` `list` | How it works | `public/icons/landing/step-list.svg` | `List` |
| `StepIcon` `check` | How it works | `public/icons/landing/step-check.svg` | `CircleCheck` |
| `StepIcon` `van` | How it works | `public/icons/landing/step-van.svg` | `Truck` |

`StepIcon` and `TrustIcon` share three shapes between them at different stroke widths (1.9 and
2), which is why `van`, `list` and `check` appear twice.

---

## What this changes on screen

This is the one stage of the restructure that alters the design on purpose. Lucide's icons are
drawn on a different grid with different stroke weights and different optical sizing, so
shapes, weights and alignment all shift. The pixel audit is expected to report differences
here — that is the point — and the archive above is the way back.
