export type CafeBranchSpecificity =
  | "explicit"
  | "expanded-from-unspecified"
  | "inferred-toronto-scope"
  | "inferred-from-named-sibling";

export type CafeVerificationStatus = "verified" | "branch-unspecified";

export type CafeCoordinateConfidence = "poi" | "address";

export type Cafe = Readonly<{
  id: string;
  slug: string;
  name: string;
  branch: string | null;
  address: string;
  addressVerified: boolean;
  neighborhood: string;
  lat: number;
  lng: number;
  coordinateConfidence: CafeCoordinateConfidence;
  branchSpecificity: CafeBranchSpecificity;
  verificationStatus: CafeVerificationStatus;
  moods: readonly string[];
  offerings: readonly string[];
  attributes: readonly string[];
  recommendation: string;
  sourceUrl: string;
  mapsUrl: string;
  verifiedAt: string;
}>;
