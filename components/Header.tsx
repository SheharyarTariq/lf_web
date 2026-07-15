import Link from "next/link";
import Logo from "@/components/Logo";
import GetAppButton from "@/components/GetAppButton";

// Shared sticky header. Lives in the root layout so it persists across client
// navigation (mounts once — no per-page remount/flash).
export default function Header() {
  return (
    <nav className="bg-dark px-12 h-[58px] flex items-center justify-between sticky top-0 z-[99] max-[860px]:px-5">
      <Link href="/" className="no-underline">
        <Logo />
      </Link>
      {/* Sends phones straight to their store and desktop to the homepage hero
          card, which has the scannable QR. Fires the Google Ads app-download
          conversion on click. */}
      <GetAppButton className="bg-lime text-dark font-bold text-[13px] py-2 px-5 rounded-[30px] no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]">
        Get the App
      </GetAppButton>
    </nav>
  );
}
