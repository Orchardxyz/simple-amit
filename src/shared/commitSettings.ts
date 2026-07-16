import type { ProviderId } from "openai-compatible-provider-registry" with { "resolution-mode": "require" };

export type ProviderType = "anthropic" | "gemini" | "compatible";
export type CommitMessageLanguage = "zh-CN" | "en";
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
