export type CafeBranchSpecificity =
  | "explicit"
  | "expanded-from-unspecified"
  | "inferred-toronto-scope"
  | "inferred-from-named-sibling";

export type CafeVerificationStatus = "verified" | "branch-unspecified";

export type CafeCoordinateConfidence = "poi" | "address";

type CafeDetails = Readonly<{
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
  moods: readonly string[];
  offerings: readonly string[];
  attributes: readonly string[];
  recommendation: string;
  sourceUrl: string;
  mapsUrl: string;
  verifiedAt: string;
}>;

type ExplicitCafeVerification = Readonly<{
  branchSpecificity: "explicit";
  verificationStatus: "verified";
}>;

type BranchUnspecifiedCafeVerification = Readonly<{
  branchSpecificity: Exclude<CafeBranchSpecificity, "explicit">;
  verificationStatus: "branch-unspecified";
}>;

export type Cafe = CafeDetails &
  (ExplicitCafeVerification | BranchUnspecifiedCafeVerification);
