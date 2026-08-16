/**
 * Every route string in the site — UI paths and API endpoints — lives here.
 * Nothing else should hard-code a path. See .claude/skills/web-api-patterns.
 *
 * ── One deliberate deviation from the skill ───────────────────────────────
 * The skill says `routes.api` values carry NO leading slash, because the base
 * URL is prepended by the caller. `apiCall` builds `${BASE_URL}${endpoint}`,
 * so that only works when BASE_URL ends in a slash. Ours does not —
 * NEXT_PUBLIC_API_URL is `https://api.staging.laundryfree.co.uk` — and adding
 * one would give `//system-status` to the three callers that already prepend
 * a slash of their own (AnnounceBar, lib/api.ts, the deletion form).
 *
 * So the values below keep their leading slash. It matches how the backend
 * brief writes them (docs/FE-API-GUIDE.md) and needs no change to the env var.
 * If the other project's apiUrl carries a trailing slash, this is the line
 * that has to be reconciled — see docs/STATUS.md.
 *
 * Paths are transcribed from docs/FE-API-GUIDE.md. Nothing here is called yet;
 * wiring is the next task.
 */

export const routes = {
  ui: {
    indexRoute: "/",

    /* Checkout. The step segment is validated in lib/booking/flow.ts. */
    book: (step: string) => `/book/${step}`,

    /* Sections of the landing page, not routes of their own. Written as
       root-relative so they work from any page: a bare "#faq" on a service
       page looks for a section that is not there. Next resolves the hash
       after the client-side transition, so these stay <Link>s. */
    home: {
      howItWorks: "/#how-it-works",
      pricing: "/#pricing",
      areas: "/#areas",
      faq: "/#faq",
      getTheApp: "/#get-the-app",
    },

    /* Marketing */
    washAndFold: "/wash-and-fold",
    laundryCollectionDelivery: "/laundry-collection-delivery",
    blog: "/blog",
    /* Town pages. The slug is the whole identity of these — they exist for
       the search term, so the URL is the product. */
    laundryService: (town: string) => `/laundry-service-${town}`,

    /* 308s to the matching landing-page section, kept because they were live
       URLs on the old site and still carry inbound links. Deliberately absent
       from sitemap.ts — the anchors above are the canonical destination. */
    faq: "/faq",
    howItWorks: "/how-it-works",
    downloadApp: "/download-app",

    /* Legal and support */
    contact: "/contact",
    privacyPolicy: "/privacy-policy",
    terms: "/terms",
    requestDeletion: "/request-deletion",

    /* verifyEmail is a real page: it reads `token` from the query string and
       submits it as `code`. The association files still claim the path, so a
       phone with the app installed opens the app and the page never renders —
       which is why making it real needed no change there.

       The three below are still DeepLinkFallback stubs. /reset-password is the
       one that should follow, once the modal's forgot pane calls
       /reset-password/request for real. See docs/STATUS.md. */
    verifyEmail: "/verify-email",
    resetPassword: "/reset-password",
    paymentMethodAdd: "/payment-methods/add",
    paymentCallback: "/payment-callback",
    orderDetails: (orderId: string | number) => `/orders/${orderId}`,
  },

  api: {
    /* ── Public: no Bearer token ────────────────────────────────────── */
    register: "/register",
    loginCheck: "/login-check",
    systemStatus: "/system-status",
    resetPasswordRequest: "/reset-password/request",
    resetPasswordConfirm: "/reset-password/confirm",

    /* { email, purpose } where purpose is one of email_verification, login or
       password_reset — anything else is a 422 naming `purpose`. Answers 200
       even for an address with no account, so it cannot be used to ask who is
       a customer, which also means it cannot report that nothing was sent.
       Prefer emailVerificationResend wherever a token is in hand; this is for
       the verify-email page reached from a mail client with no session. */
    verificationCodeRequest: "/verification-code/request",

    /* ── Authenticated ──────────────────────────────────────────────── */

    /* Everything about the current user in one call. Hydrates after login
       and on load: user, address, recentActiveOrder, completedOrderCount,
       paymentMethods, recurring, nextOrderDiscount. */
    myStatus: "/my-status",

    /* Both need a Bearer token, but not a *session* — utils/auth runs them on
       the pending token, since an unverified account deliberately never gets
       one. Trigger is emailVerifiedAt === null from /login-check or /my-status. */
    emailVerificationVerify: "/email-verification/verify",
    emailVerificationResend: "/email-verification/resend",

    /* POST, not GET — the postcode goes in the body as `postcodeString`.
       Response carries `isActive`, which replaces the hardcoded SERVED
       district table in lib/booking/model.ts. */
    findAddresses: "/find-addresses",
    postcodeActivationNotifications: "/postcode-activation-notifications",
    /* PATCH, and the only endpoint needing
       `Content-Type: application/merge-patch+json`. */
    updateAddress: (userId: string | number) => `/users/${userId}/update-address`,

    /* `days` is optional on pickup, max 28. Dropoff needs both
       ?pickupSlot=<IRI>&pickupDate=YYYY-MM-DD. */
    slotsPickup: "/slots/pickup",
    slotsDropoff: "/slots/dropoff",
    /* Slots are referenced by IRI, not bare id — both as the `pickupSlot`
       query param and in the POST /orders body. */
    slotIri: (slotId: string | number) => `/slots/${slotId}`,

    /* Card capture is a SetupIntent, not a payment: POST for the client
       secret, hand it to Stripe.js, then poll check-status until it answers
       true (saved, and made default) or false (retry). null = still pending. */
    paymentMethodsSetupIntent: "/payment-methods/setup-intent",
    paymentMethodsCheckStatus: "/payment-methods/check-status",
    paymentMethodMarkDefault: (id: string | number) =>
      `/payment-methods/${id}/mark-as-default`,
    paymentMethodDelete: (id: string | number) => `/payment-methods/${id}`,

    /* Needs an address and a default card already on the account — payment is
       taken from the default card, so there is no pay step. */
    orders: "/orders",
    orderCancel: (id: string | number) => `/orders/${id}/mark-as-cancelled`,

    /* Only allowed while the email is unverified; it exists to fix a typo
       made at registration. Returns 400 once emailVerifiedAt is set. */
    changeEmail: (userId: string | number) => `/users/${userId}/change-email`,

    /* In production use at app/(site)/request-deletion, but absent from the
       backend brief — listed here so the hardcoded URL in that page has
       somewhere to move to. */
    requestDeletion: "/request-deletion",
  },
};
