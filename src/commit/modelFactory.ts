import type { CommitSettings } from "../shared/commitSettings";
import type { LanguageModel } from "ai" with { "resolution-mode": "import" };

export async function createCommitLanguageModel(settings: CommitSettings, apiKey: string): Promise<LanguageModel> {
  const model = settings.model.trim();

  if (settings.providerType === "anthropic") {
    const { createAnthropic } = await import("@ai-sdk/anthropic");
    return createAnthropic({ apiKey })(model);
  }

  if (settings.providerType === "gemini") {
    const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
    return createGoogleGenerativeAI({ apiKey })(model);
  }

  const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");

  return createOpenAICompatible({
    apiKey,
    baseURL: normalizeCompatibleBaseUrl(settings.baseUrl, settings.compatibleProviderId),
    name: settings.compatibleProviderId
  }).chatModel(model);
}

function normalizeCompatibleBaseUrl(baseUrl: string, compatibleProviderId: string) {
  const trimmedBaseUrl = baseUrl.trim().replace(/\/$/, "");

  if (compatibleProviderId === "openai" && trimmedBaseUrl === "https://api.openai.com") {
    return "https://api.openai.com/v1";
  }

  return trimmedBaseUrl;
}
