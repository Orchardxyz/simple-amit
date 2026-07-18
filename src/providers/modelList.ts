import type { CommitSettings } from "../shared/commitSettings";
import type * as CompatibleProviderRegistry from "openai-compatible-provider-registry" with { "resolution-mode": "require" };

type ProviderRegistry = typeof CompatibleProviderRegistry;

export type FetchModelListParams = {
  apiKey?: string;
  settings: CommitSettings;
};

export type ModelListResult = {
  models: string[];
};

type FetchLike = typeof fetch;

export async function fetchModelList({ apiKey, settings }: FetchModelListParams, fetchFn: FetchLike = fetch): Promise<ModelListResult> {
  if (settings.providerType !== "compatible") {
    throw new Error("Dynamic model fetching is only supported for OpenAI-compatible providers.");
  }

  const resolvedApiKey = apiKey?.trim();

  if (resolvedApiKey === undefined || resolvedApiKey.length === 0) {
    throw new Error("An API key is required to fetch models.");
  }

  const registry = getProviderRegistry();
  const result = await registry.fetchModels(settings.compatibleProviderId, {
    apiKey: resolvedApiKey,
    baseUrl: normalizeCompatibleModelListBaseUrl(settings),
    fetch: fetchFn
  });
  const models = [...new Set(result.models.map((model) => model.id).filter((model) => model.trim().length > 0))].sort((left, right) =>
    left.localeCompare(right)
  );

  if (models.length === 0) {
    throw new Error("The provider returned an empty model list.");
  }

  return { models };
}

export function createModelListUrl(settings: CommitSettings) {
  const provider = getProviderRegistry().getProvider(settings.compatibleProviderId);
  const modelsPath = provider?.modelsPath ?? "models";
  const trimmedBaseUrl = normalizeCompatibleModelListBaseUrl(settings);
  const trimmedModelsPath = modelsPath.replace(/^\//, "");

  return `${trimmedBaseUrl}/${trimmedModelsPath}`;
}

function normalizeCompatibleModelListBaseUrl(settings: CommitSettings) {
  const trimmedBaseUrl = settings.baseUrl.trim().replace(/\/$/, "");

  if (settings.compatibleProviderId === "openai" && trimmedBaseUrl === "https://api.openai.com") {
    return "https://api.openai.com/v1";
  }

  return trimmedBaseUrl;
}

function getProviderRegistry(): ProviderRegistry {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("openai-compatible-provider-registry") as unknown as ProviderRegistry;
}
