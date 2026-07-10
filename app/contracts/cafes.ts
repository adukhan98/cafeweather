export type CafeBranchSpecificity =
  | "explicit"
  | "expanded-from-unspecified"
  | "inferred-toronto-scope"
  | "inferred-from-named-sibling";

export type CafeVerificationStatus = "verified";

export type Cafe = Readonly<{
  id: string;
  slug: string;
  name: string;
  branch: string | null;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
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
