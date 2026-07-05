import { permanentRedirect } from "next/navigation";

// /how-it-works is a permanent (308) redirect to the "How it works" section on the
// homepage, where the content lives. See the #how-it-works anchor in app/page.tsx.
export default function HowItWorks() {
  permanentRedirect("/#how-it-works");
}
