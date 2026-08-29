import type { Metadata } from "next";

export type UnreleasedRuntimeSurface =
  | "nodes"
  | "resources"
  | "offers"
  | "requests"
  | "trust";

export const UNRELEASED_SURFACE_METADATA: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
