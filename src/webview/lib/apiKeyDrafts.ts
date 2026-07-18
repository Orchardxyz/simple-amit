import type { CommitSettings } from "../../shared/commitSettings";

type ApiKeyDraftSettings = Pick<CommitSettings, "compatibleProviderId" | "providerType">;

export type ApiKeyDrafts = Record<string, string>;

export function getApiKeyDraft(drafts: ApiKeyDrafts, settings: ApiKeyDraftSettings) {
  const draftKey = getApiKeyDraftKey(settings);

  return Object.prototype.hasOwnProperty.call(drafts, draftKey) ? drafts[draftKey] : undefined;
}

export function saveApiKeyDraft(drafts: ApiKeyDrafts, settings: ApiKeyDraftSettings, apiKey: string): ApiKeyDrafts {
  return {
    ...drafts,
    [getApiKeyDraftKey(settings)]: apiKey
  };
}

function getApiKeyDraftKey(settings: ApiKeyDraftSettings) {
  if (settings.providerType === "compatible") {
    return `compatible:${settings.compatibleProviderId}`;
  }

  return settings.providerType;
}
