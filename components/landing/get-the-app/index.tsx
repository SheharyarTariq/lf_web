import StoreButtons from "@/components/common/StoreButtons";
import { ASSETS, BRAND } from "@/utils/content";
import { SECTION, SECTION_H2_MARGIN, WRAP } from "@/utils/styles";

/**
 * App section. Split so one block serves both contexts: store badges are the
 * useful thing on a phone (they deep-link), the QR is the useful thing on a
 * desktop. The QR is hidden below 720px — you cannot scan your own screen —
 * and the badges carry it there.
 *
 * This section replaces the old homepage's #download card. DeepLinkFallback
 * sends desktop visitors here when the OS fails to open the app, and it was
 * updated to #get-the-app to match — nothing else referenced the old anchor
 * once GetAppButton was retired.
 */
export default function GetTheApp() {
  return (
    <section className={`${SECTION} bg-white`} id="get-the-app" aria-labelledby="lf-app-h">
      <div
        className={`${WRAP} grid grid-cols-[1.05fr_.95fr] items-center gap-12 to-1180:gap-9 to-1024:grid-cols-[1fr]`}
      >
        <div>
          <h2
            id="lf-app-h"
            className={`mb-2.5 text-[clamp(26px,2.9vw,36px)] font-extrabold leading-[1.12] tracking-[-1.1px] ${SECTION_H2_MARGIN}`}
          >
            Do it all from your phone.
          </h2>
          <p className="mb-[26px] max-w-[460px] text-[16.5px] text-ink-2 to-1180:text-[15.5px] to-1024:max-w-none">
            Live order tracking, instant alerts the moment your items are priced, saved preferences
            and recurring collections — all in one place.
          </p>

          <div className="flex overflow-hidden rounded-card-lg bg-panel to-1024:max-w-[560px] to-720:block">
            <div className="flex flex-1 flex-col items-start gap-3 p-6 to-720:items-center to-720:text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="rounded-xl"
                src={ASSETS.appIcon}
                alt=""
                width="56"
                height="56"
                loading="lazy"
              />
              {/* Scoped to the paragraph: unscoped, the strong rule also hit
                  the <strong> inside the store badges, painting "App Store"
                  and "Google Play" ink on ink. */}
              <p className="text-[15px] text-ink-2">
                <strong className="font-bold text-ink">Available</strong> on iOS and Android.
              </p>
              <StoreButtons />
            </div>

            {/* No hard rule and no background step — a 1px line and a colour
                change both cut the panel in two. A divider that fades out at
                both ends separates the halves without drawing a border. Kept
                as a pseudo-element rather than a real span so the subtree
                matches the design's node for node. */}
            <div className="relative w-[190px] flex-none px-5 py-6 text-center before:absolute before:bottom-[16%] before:left-0 before:top-[16%] before:w-px before:bg-[linear-gradient(to_bottom,rgba(18,18,15,0)_0%,rgba(18,18,15,.12)_30%,rgba(18,18,15,.12)_70%,rgba(18,18,15,0)_100%)] before:content-[''] to-720:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="mx-auto mb-2.5 h-[132px] w-[132px] rounded-lg bg-white"
                src={ASSETS.appQr}
                alt={`QR code linking to the ${BRAND.name} app`}
                width="132"
                height="132"
                loading="lazy"
              />
              <p className="text-[13px] leading-[1.45] text-ink-2">
                Or scan the QR code with your device.
              </p>
            </div>
          </div>
        </div>

        {/* Ratio matches the source (1419x1108) so object-fit never crops the
            phone. Same smoothstep feather as the hero — multi-stop so the
            alpha ramp eases in and out instead of ending on a visible
            crease. */}
        <div className="mask-shot-fade aspect-[1419/1108] overflow-hidden to-1024:max-w-[520px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="block h-full w-full object-cover object-center"
            src={ASSETS.appPhone}
            srcSet={`${ASSETS.appPhoneSmall} 600w, ${ASSETS.appPhone} 1200w`}
            sizes="(max-width: 1024px) 92vw, 44vw"
            alt={`A customer holding a phone showing the ${BRAND.name} app, with a welcome offer and the booking steps on screen.`}
            width="1200"
            height="937"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
