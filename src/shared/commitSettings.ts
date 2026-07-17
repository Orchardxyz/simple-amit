import type { ProviderId } from "openai-compatible-provider-registry" with { "resolution-mode": "require" };

export const providerTypes = ["anthropic", "gemini", "compatible"] as const;
export const commitMessageLanguages = ["zh-CN", "en"] as const;

export type ProviderType = (typeof providerTypes)[number];
export type CommitMessageLanguage = (typeof commitMessageLanguages)[number];
export type CompatibleProviderId = ProviderId;

export type CommitSettings = {
  providerType: ProviderType;
  compatibleProviderId: CompatibleProviderId;
  baseUrl: string;
  model: string;
  language: CommitMessageLanguage;
  instructions: string;
};

export const defaultInstructions =
  "Analyze the workspace changes as the source of truth. Learn the repository's commit-message format from recent Git history, including its language, type, scope, and tone. If history is insufficient or inconsistent, use Conventional Commits: type(scope): short subject. Choose a type that reflects the change; use style for visual-only changes. Return only one commit message in the selected language.";

export function isProviderType(value: unknown): value is ProviderType {
  return providerTypes.includes(value as ProviderType);
}

export function isCommitMessageLanguage(value: unknown): value is CommitMessageLanguage {
  return commitMessageLanguages.includes(value as CommitMessageLanguage);
}

export function isCommitSettings(value: unknown): value is CommitSettings {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isProviderType(value.providerType) &&
    typeof value.compatibleProviderId === "string" &&
    typeof value.baseUrl === "string" &&
    typeof value.model === "string" &&
    isCommitMessageLanguage(value.language) &&
    typeof value.instructions === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
