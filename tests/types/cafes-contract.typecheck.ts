import type { Cafe } from "../../app/contracts/cafes";

const commonCafe = {
  id: "test-cafe",
  slug: "test-cafe",
  name: "Test Cafe",
  branch: "Test Branch",
  address: "1 Test St, Toronto, ON",
  addressVerified: true,
  neighborhood: "Test Neighborhood",
  lat: 43.65,
  lng: -79.38,
  coordinateConfidence: "poi",
  moods: ["calm"],
  offerings: ["coffee"],
  attributes: [],
  recommendation: "A test recommendation.",
  sourceUrl: "https://example.com/test-cafe",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=43.65,-79.38",
  verifiedAt: "2026-07-09",
} as const;

const explicitCafe = {
  ...commonCafe,
  branchSpecificity: "explicit",
  verificationStatus: "verified",
} satisfies Cafe;

const expandedCafe = {
  ...commonCafe,
  branchSpecificity: "expanded-from-unspecified",
  verificationStatus: "branch-unspecified",
} satisfies Cafe;

// @ts-expect-error Explicit branches must be verified.
const invalidExplicitCafe: Cafe = {
  ...commonCafe,
  branchSpecificity: "explicit",
  verificationStatus: "branch-unspecified",
};

// @ts-expect-error Expanded and inferred branches remain branch-unspecified.
const invalidExpandedCafe: Cafe = {
  ...commonCafe,
  branchSpecificity: "inferred-toronto-scope",
  verificationStatus: "verified",
};

void [
  explicitCafe,
  expandedCafe,
  invalidExplicitCafe,
  invalidExpandedCafe,
];
