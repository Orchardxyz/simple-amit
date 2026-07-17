import type { CommitSettings } from "../shared/commitSettings";
import type * as vscode from "vscode";

const apiKeySecretPrefix = "simple-amit.apiKey";

export type ApiKeyStore = {
  deleteApiKey(settings: CommitSettings): Promise<void>;
  hasApiKey(settings: CommitSettings): Promise<boolean>;
  saveApiKey(settings: CommitSettings, apiKey: string): Promise<void>;
};

export function createApiKeyStore(secrets: vscode.SecretStorage): ApiKeyStore {
  return {
    async deleteApiKey(settings) {
      await secrets.delete(getApiKeySecretKey(settings));
    },
    async hasApiKey(settings) {
      const apiKey = await secrets.get(getApiKeySecretKey(settings));
      return apiKey !== undefined && apiKey.length > 0;
    },
    async saveApiKey(settings, apiKey) {
      await secrets.store(getApiKeySecretKey(settings), apiKey);
    }
  };
}

export function getApiKeySecretKey(settings: CommitSettings) {
  if (settings.providerType === "compatible") {
    return `${apiKeySecretPrefix}.compatible:${settings.compatibleProviderId}`;
  }

  return `${apiKeySecretPrefix}.${settings.providerType}`;
}
