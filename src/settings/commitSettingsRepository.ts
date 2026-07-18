import * as vscode from "vscode";
import { getDefaultCommitSettings } from "../providers/compatibleProviderRegistry";
import {
  getCurrentProviderModel,
  isCommitMessageLanguage,
  isProviderType,
  resolveCommitProviderModels,
  saveCurrentProviderModel,
  type CommitSettings,
  type CompatibleProviderId
} from "../shared/commitSettings";

export const commitSettingsConfigurationSection = "simple-amit";

const commitSettingsKeys = {
  providerType: "providerType",
  compatibleProviderId: "compatibleProviderId",
  baseUrl: "baseUrl",
  models: "models",
  language: "language",
  instructions: "instructions"
} as const satisfies Record<Exclude<keyof CommitSettings, "model">, string>;

type RawCommitSettings = Partial<Record<keyof CommitSettings, unknown>>;

export function getCommitSettings(): CommitSettings {
  const configuration = vscode.workspace.getConfiguration(commitSettingsConfigurationSection);

  return resolveCommitSettings({
    providerType: configuration.get(commitSettingsKeys.providerType),
    compatibleProviderId: configuration.get(commitSettingsKeys.compatibleProviderId),
    baseUrl: configuration.get(commitSettingsKeys.baseUrl),
    models: configuration.get(commitSettingsKeys.models),
    language: configuration.get(commitSettingsKeys.language),
    instructions: configuration.get(commitSettingsKeys.instructions)
  });
}

export async function saveCommitSettings(settings: CommitSettings): Promise<CommitSettings> {
  const nextSettings = resolveCommitSettings({
    ...settings,
    models: saveCurrentProviderModel(settings)
  });
  const configuration = vscode.workspace.getConfiguration(commitSettingsConfigurationSection);

  await Promise.all(
    Object.entries(commitSettingsKeys).map(([settingsKey, configurationKey]) =>
      configuration.update(configurationKey, nextSettings[settingsKey as keyof CommitSettings], vscode.ConfigurationTarget.Global)
    )
  );

  return nextSettings;
}

export async function resetCommitSettings(): Promise<CommitSettings> {
  const configuration = vscode.workspace.getConfiguration(commitSettingsConfigurationSection);

  await Promise.all(
    Object.values(commitSettingsKeys).map((configurationKey) => configuration.update(configurationKey, undefined, vscode.ConfigurationTarget.Global))
  );

  return getDefaultCommitSettings();
}

export function resolveCommitSettings(rawSettings: RawCommitSettings, defaults: CommitSettings = getDefaultCommitSettings()): CommitSettings {
  const resolvedSettings = {
    providerType: isProviderType(rawSettings.providerType) ? rawSettings.providerType : defaults.providerType,
    compatibleProviderId:
      typeof rawSettings.compatibleProviderId === "string"
        ? (rawSettings.compatibleProviderId as CompatibleProviderId)
        : defaults.compatibleProviderId,
    baseUrl: typeof rawSettings.baseUrl === "string" ? rawSettings.baseUrl : defaults.baseUrl,
    models: resolveCommitProviderModels(rawSettings.models, defaults.models),
    language: isCommitMessageLanguage(rawSettings.language) ? rawSettings.language : defaults.language,
    instructions: typeof rawSettings.instructions === "string" ? rawSettings.instructions : defaults.instructions
  };

  return {
    ...resolvedSettings,
    model: getCurrentProviderModel(resolvedSettings)
  };
}
