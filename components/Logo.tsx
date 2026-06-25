export default function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/footerlogo.svg" alt="Laundry Free" className={className} />
  );
}
