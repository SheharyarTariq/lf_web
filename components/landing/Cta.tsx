"use client";

import { BRAND } from "@/lib/content";
import { btn } from "@/lib/button";
import { useStartBooking } from "@/lib/hooks";
import { WRAP } from "@/lib/styles";

export default function Cta() {
  const startBooking = useStartBooking();

  return (
    <section
      className="border-b border-b-line bg-paper-2 py-16 text-center to-1280:py-[52px] to-1024:py-[46px] to-720:py-12"
      aria-labelledby="lf-cta-h"
    >
      <div className={WRAP}>
        <h2
          id="lf-cta-h"
          className="mb-2 text-[clamp(28px,3vw,36px)] font-extrabold tracking-[-1.1px]"
        >
          {BRAND.slogan}
        </h2>
        <p className="mb-[26px] text-[16.5px] text-ink-2">
          Free collection and delivery on every order. {BRAND.offer}.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {/* No "Get the app" here — the section directly above is the app
              download. The page should close on booking. */}
          <button
            type="button"
            className={btn({ className: "to-480:w-full" })}
            onClick={() => startBooking()}
          >
            Check availability
          </button>
        </div>
      </div>
    </section>
  );
}
