// Deep link → lf-app ChangePassword ("reset-password?email=…&token=…").
import DeepLinkFallback, {
  deepLinkMetadata,
} from "@/components/common/DeepLinkFallback";

export const metadata = deepLinkMetadata;
export default DeepLinkFallback;
