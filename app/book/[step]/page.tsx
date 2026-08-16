import { notFound } from "next/navigation";
import AddressScreen from "@/components/booking/screens/AddressScreen";
import TimeScreen from "@/components/booking/screens/TimeScreen";
import ContactScreen from "@/components/booking/screens/ContactScreen";
import ReviewScreen from "@/components/booking/screens/ReviewScreen";
import PaymentScreen from "@/components/booking/screens/PaymentScreen";
import ConfirmedScreen from "@/components/booking/screens/ConfirmedScreen";
import { ROUTES, isRoute } from "@/lib/booking/flow";

/* One file per step in the prototype's URL scheme — /book/address …
   /book/confirmed — so the flow stays linkable and the back button works
   without a router library. */
export function generateStaticParams() {
  return ROUTES.map((step) => ({ step }));
}

const SCREENS = {
  address: AddressScreen,
  time: TimeScreen,
  contact: ContactScreen,
  review: ReviewScreen,
  payment: PaymentScreen,
  confirmed: ConfirmedScreen,
} as const;

export default async function BookStep({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (!isRoute(step)) notFound();
  const Screen = SCREENS[step];
  return <Screen />;
}
