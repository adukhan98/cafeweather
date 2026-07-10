export type CafeFilters = Readonly<{
  search?: string;
  neighborhoods?: readonly string[];
  moods?: readonly string[];
  offerings?: readonly string[];
  attributes?: readonly string[];
}>;
