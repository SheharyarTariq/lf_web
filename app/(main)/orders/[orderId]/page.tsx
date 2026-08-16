// Deep link → lf-app OrderDetail ("orders/:orderId"), the screen the emailed
// "Review" button targets and the entry point for Review Items.
import DeepLinkFallback, {
  deepLinkMetadata,
} from "@/components/common/DeepLinkFallback";

export const metadata = deepLinkMetadata;
export default DeepLinkFallback;
