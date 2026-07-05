import Link from "next/link";
import Logo from "@/components/Logo";
import ConversionLink from "@/components/ConversionLink";

// Shared sticky header. Lives in the root layout so it persists across client
// navigation (mounts once — no per-page remount/flash).
export default function Header() {
  return (
    <nav className="bg-dark px-12 h-[58px] flex items-center justify-between sticky top-0 z-[99] max-[860px]:px-5">
      <Link href="/" className="no-underline">
        <Logo />
      </Link>
      {/* /download-app is a server route that sniffs the user-agent and redirects
          to the App Store / Play Store. Opens in a new tab. ConversionLink fires
          the Google Ads app-download conversion on click. */}
      <ConversionLink
        href="/download-app"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-lime text-dark font-bold text-[13px] py-2 px-5 rounded-[30px] no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
      >
        Get the App
      </ConversionLink>
    </nav>
  );
}
