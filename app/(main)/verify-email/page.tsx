// Deep link → lf-app EmailVerification ("verify-email?token=…").
import DeepLinkFallback, {
  deepLinkMetadata,
} from "@/components/common/DeepLinkFallback";

export const metadata = deepLinkMetadata;
export default DeepLinkFallback;
