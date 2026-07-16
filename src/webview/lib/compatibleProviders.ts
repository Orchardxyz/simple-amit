import { getProvider, PROVIDER_IDS, PROVIDERS } from "openai-compatible-provider-registry";
import { defaultInstructions, type CommitSettings } from "../../shared/commitSettings";

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
