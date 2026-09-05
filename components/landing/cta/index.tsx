"use client";

import Button from "@/components/common/Button";
import { useAuth } from "@/components/common/AuthProvider";
import { BRAND } from "@/utils/content";
import { useStartBooking } from "@/utils/hooks";
import { WRAP } from "@/utils/styles";

export default function Cta() {
  /* Signed out is the default and renders straight away, so the server HTML is
     never missing a call to action; only a returning customer sees one frame of
     "Check availability" before their own wording replaces it. The same rule
     the site header follows for "Log in". */
  const { user, status } = useAuth();
  const startBooking = useStartBooking(status);

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
          {/* "Check availability" is the question somebody asks before they
              have an account. A returning customer has already had it answered
              — we hold an address we serve — so the button says what it now
              actually does. */}
          <Button className="to-480:w-full" onClick={() => startBooking()}>
            {user ? "Book now" : "Check availability"}
          </Button>
        </div>
      </div>
    </section>
  );
}
