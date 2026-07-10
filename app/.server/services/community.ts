import type {
  CommunityRepository,
  SuggestionRecord,
} from "../db/repositories";
import { HttpError } from "../http-errors";

export type TurnstileVerifier = (input: {
  secret: string;
  token: string;
}) => Promise<boolean>;

export async function verifyTurnstileRemote({
  secret,
  token,
}: {
  secret: string;
  token: string;
}): Promise<boolean> {
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body },
  );
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

export class CommunityService {
  constructor(
    private readonly repository?: CommunityRepository,
    private readonly turnstileSecret?: string,
    private readonly verifyTurnstile: TurnstileVerifier = verifyTurnstileRemote,
  ) {}

  private available(): CommunityRepository {
    if (!this.repository) {
      throw new HttpError(
        503,
        "community_unavailable",
        "Community features are temporarily unavailable.",
      );
    }
    return this.repository;
  }

  async checkTurnstile(token?: string): Promise<void> {
    if (!this.turnstileSecret) return;
    if (
      !token ||
      !(await this.verifyTurnstile({
        secret: this.turnstileSecret,
        token,
      }))
    ) {
      throw new HttpError(
        400,
        "turnstile_failed",
        "Human verification failed.",
      );
    }
  }

  async addReaction(cafeId: string, visitorHash: string, kind: string) {
    const changed = await this.available().addReaction(
      cafeId,
      visitorHash,
      kind,
    );
    return { active: true, changed };
  }

  async removeReaction(cafeId: string, visitorHash: string, kind: string) {
    const changed = await this.available().removeReaction(
      cafeId,
      visitorHash,
      kind,
    );
    return { active: false, changed };
  }

  async createSuggestion(suggestion: SuggestionRecord) {
    return this.available().createSuggestion(suggestion);
  }
}
