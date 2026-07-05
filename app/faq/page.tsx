import { permanentRedirect } from "next/navigation";

// /faq is a permanent (308) redirect to the FAQ section on the homepage.
// See the #faq anchor in app/page.tsx.
export default function Faq() {
  permanentRedirect("/#faq");
}
