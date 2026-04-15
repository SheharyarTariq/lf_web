"use client";

import { useState } from "react";
import Link from "next/link";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RequestDeletion() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("https://api.staging.laundryfree.co.uk/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const isDisabled = status === "loading" || status === "success";

  return (
    <>
      {/* ── PROMO BAR ── */}
      <div className="bg-lime py-[10px] px-12 text-center text-[13px] font-bold text-dark tracking-[0.1px]">
        🎉 50% off your first order{" "}
        <span className="font-normal opacity-70">— download the app to claim</span>
      </div>

      {/* ── NAV ── */}
      <nav className="bg-dark px-12 h-[58px] flex items-center justify-between sticky top-0 z-[99] max-[860px]:px-5">
        <Link href="/" className="text-[18px] font-extrabold tracking-[-0.5px] no-underline">
          <span className="text-white">Laundry</span>
          <span className="text-lime">Free</span>
        </Link>
        <a
          href="/#download"
          className="bg-lime text-dark font-bold text-[13px] py-2 px-5 rounded-[30px] no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
        >
          Get the App
        </a>
      </nav>

      {/* ── CONTENT ── */}
      <main className="max-w-[1080px] mx-auto px-12 py-[72px] max-[860px]:px-5 max-[860px]:py-[52px]">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-muted mb-2 text-center">
          Account
        </div>
        <h1 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1.2px] leading-[1.1] text-dark mb-4 text-center">
          Request Account Deletion
        </h1>
        <p className="text-[14px] text-muted text-center mb-12 max-w-[480px] mx-auto">
          Enter your email address below. We&apos;ll contact you to verify your identity before
          proceeding with the deletion.
        </p>

        <div className="max-w-[420px] mx-auto">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold text-dark mb-2"
              >
                Your email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isDisabled}
                placeholder="you@example.com"
                className="w-full border border-lf-border rounded-[12px] px-4 py-3 text-[14px] text-dark bg-white placeholder:text-muted/60 outline-none focus:border-dark transition-colors duration-[150ms] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {validationError && (
                <p className="text-[13px] text-red-500 mt-2">{validationError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full bg-dark text-white font-bold text-[14px] py-3 px-6 rounded-[30px] transition-opacity duration-[180ms] hover:opacity-[0.82] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending…" : "Request Deletion"}
            </button>
          </form>

          {status === "success" && (
            <p className="mt-6 text-[14px] text-dark/80 leading-[1.7] text-center italic">
              Your request has been received. We&apos;ll contact you at the email address provided
              to verify your identity before proceeding with the deletion.
            </p>
          )}

          {status === "error" && (
            <p className="mt-6 text-[14px] text-dark/80 leading-[1.7] text-center italic">
              Something went wrong. Please try again or contact us at{" "}
              <a
                href="mailto:hello@laundryfree.co.uk"
                className="text-dark underline hover:opacity-70 transition-opacity duration-[150ms]"
              >
                hello@laundryfree.co.uk
              </a>
            </p>
          )}
        </div>
      </main>
    </>
  );
}
