import type { ProviderId } from "openai-compatible-provider-registry" with { "resolution-mode": "require" };

export const providerTypes = ["anthropic", "gemini", "compatible"] as const;
export const commitMessageLanguages = ["zh-CN", "en"] as const;

export type ProviderType = (typeof providerTypes)[number];
export type CommitMessageLanguage = (typeof commitMessageLanguages)[number];
export type CompatibleProviderId = ProviderId;

export type CommitProviderModels = {
  anthropic: string;
  gemini: string;
  compatible: Partial<Record<CompatibleProviderId, string>>;
};

export type CommitSettings = {
  providerType: ProviderType;
  compatibleProviderId: CompatibleProviderId;
  baseUrl: string;
  model: string;
  models: CommitProviderModels;
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
    isCommitProviderModels(value.models) &&
    isCommitMessageLanguage(value.language) &&
    typeof value.instructions === "string"
  );
}

export function createDefaultCommitProviderModels(): CommitProviderModels {
  return {
    anthropic: "",
    gemini: "",
    compatible: {}
  };
}

export function resolveCommitProviderModels(
  value: unknown,
  defaults: CommitProviderModels = createDefaultCommitProviderModels()
): CommitProviderModels {
  if (!isRecord(value)) {
    return { ...defaults, compatible: { ...defaults.compatible } };
  }

  return {
    anthropic: typeof value.anthropic === "string" ? value.anthropic : defaults.anthropic,
    gemini: typeof value.gemini === "string" ? value.gemini : defaults.gemini,
    compatible: resolveCompatibleProviderModels(value.compatible, defaults.compatible)
  };
}

export function getCurrentProviderModel(settings: Pick<CommitSettings, "compatibleProviderId" | "models" | "providerType">) {
  if (settings.providerType === "compatible") {
    return settings.models.compatible[settings.compatibleProviderId] ?? "";
  }

  return settings.models[settings.providerType];
}

export function saveCurrentProviderModel(settings: CommitSettings): CommitProviderModels {
  const model = settings.model;

  if (settings.providerType === "compatible") {
    return {
      ...settings.models,
      compatible: {
        ...settings.models.compatible,
        [settings.compatibleProviderId]: model
      }
    };
  }

  return {
    ...settings.models,
    [settings.providerType]: model
  };
}

export function resolveCurrentProviderModel(settings: Omit<CommitSettings, "model">): CommitSettings {
  return {
    ...settings,
    model: getCurrentProviderModel(settings)
  };
}

export function isCommitProviderModels(value: unknown): value is CommitProviderModels {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.anthropic === "string" && typeof value.gemini === "string" && isCompatibleProviderModels(value.compatible);
}

function resolveCompatibleProviderModels(value: unknown, defaults: Partial<Record<CompatibleProviderId, string>>) {
  const resolvedModels: Partial<Record<CompatibleProviderId, string>> = { ...defaults };

  if (!isRecord(value)) {
    return resolvedModels;
  }

  for (const [providerId, model] of Object.entries(value)) {
    if (typeof model === "string") {
      resolvedModels[providerId as CompatibleProviderId] = model;
    }
  }

  return resolvedModels;
}

function isCompatibleProviderModels(value: unknown): value is Partial<Record<CompatibleProviderId, string>> {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every((model) => typeof model === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
