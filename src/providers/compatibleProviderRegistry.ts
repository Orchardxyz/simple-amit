import { defaultInstructions, type CommitSettings } from "../shared/commitSettings";
import type * as CompatibleProviderRegistry from "openai-compatible-provider-registry" with { "resolution-mode": "require" };

type ProviderRegistry = typeof CompatibleProviderRegistry;

function getProviderRegistry(): ProviderRegistry {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("openai-compatible-provider-registry") as unknown as ProviderRegistry;
}

export function getDefaultCommitSettings(): CommitSettings {
  const providerRegistry = getProviderRegistry();
  const openAiProvider = providerRegistry.getProvider(providerRegistry.PROVIDER_IDS.OPENAI);

  if (openAiProvider === undefined) {
    throw new Error("The OpenAI-compatible provider registry is missing OpenAI.");
  }

  return {
    providerType: "compatible",
    compatibleProviderId: providerRegistry.PROVIDER_IDS.OPENAI,
    baseUrl: openAiProvider.baseUrl,
    model: "",
    language: "en",
    instructions: defaultInstructions
  };
}
