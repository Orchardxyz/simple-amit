import { getProvider, PROVIDER_IDS, PROVIDERS, type ProviderId } from "openai-compatible-provider-registry";

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

export const compatibleProviders = PROVIDERS;

const openAiProvider = getProvider(PROVIDER_IDS.OPENAI);

if (openAiProvider === undefined) {
  throw new Error("The OpenAI-compatible provider registry is missing OpenAI.");
}

export const defaultCommitSettings: CommitSettings = {
  providerType: "compatible",
  compatibleProviderId: PROVIDER_IDS.OPENAI,
  baseUrl: openAiProvider.baseUrl,
  model: "",
  language: "en",
  instructions: defaultInstructions
};
