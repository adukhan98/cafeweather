export const reactionKinds = [
  "cozy",
  "quiet",
  "work-friendly",
  "date-friendly",
  "late-night",
  "great-coffee",
  "great-tea",
] as const;

export type ReactionKind = (typeof reactionKinds)[number];

export const reactionLabels: Readonly<Record<ReactionKind, string>> = {
  cozy: "Cozy",
  quiet: "Quiet",
  "work-friendly": "Good for work",
  "date-friendly": "Good for a date",
  "late-night": "Good after dinner",
  "great-coffee": "Great coffee",
  "great-tea": "Great tea",
};

export type ReactionAggregate = Readonly<{
  kind: ReactionKind;
  count: number;
  active: boolean;
}>;

export type ReactionMutation = ReactionAggregate &
  Readonly<{
    changed: boolean;
  }>;

export type SuggestionInput = Readonly<{
  name: string;
  address?: string;
  mapUrl?: string;
  reason: string;
  recommendation?: string;
  website: string;
  turnstileToken?: string;
  submissionId: string;
}>;

export type PendingSuggestion = Readonly<{
  id: string;
  status: "pending";
}>;

export type ApiErrorBody = Readonly<{
  error: {
    code: string;
    message: string;
    fieldErrors?: Readonly<Record<string, readonly string[]>>;
    requestId: string;
  };
}>;
