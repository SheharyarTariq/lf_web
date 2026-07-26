// Stripe 3DS return target. lf-app normally gets this on the custom scheme
// (laundryfree://payment-callback) inside WebBrowser.openAuthSessionAsync, so
// this route rarely gets hit — but the path is declared in the association files
// and Android intentFilters, so it needs a fallback rather than a 404.
import DeepLinkFallback, {
  deepLinkMetadata,
} from "@/components/DeepLinkFallback";

export const metadata = deepLinkMetadata;
export default DeepLinkFallback;
