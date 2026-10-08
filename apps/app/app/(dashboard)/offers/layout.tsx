import { UnreleasedRuntimeSurface } from "../components/UnreleasedRuntimeSurface";
import { UNRELEASED_SURFACE_METADATA } from "@/lib/release-boundary";

export const metadata = UNRELEASED_SURFACE_METADATA;

export default function OffersReleaseBoundary() {
  return <UnreleasedRuntimeSurface surface="offers" />;
}
