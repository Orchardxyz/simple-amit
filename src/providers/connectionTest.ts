import { fetchModelList } from "./modelList";
import type { CommitSettings } from "../shared/commitSettings";

export type TestProviderConnectionParams = {
  apiKey?: string;
  settings: CommitSettings;
};

export type TestProviderConnectionResult = {
  message: string;
  ok: boolean;
};

type FetchLike = typeof fetch;

const directProviderChecks = {
  anthropic: {
    label: "Anthropic",
    request(apiKey: string) {
      return new Request("https://api.anthropic.com/v1/models", {
        headers: {
          "anthropic-version": "2023-06-01",
          "x-api-key": apiKey
        }
      });
    }
  },
  gemini: {
    label: "Gemini",
    request(apiKey: string) {
      return new Request("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: {
          "x-goog-api-key": apiKey
        }
      });
    }
  }
} as const;

export async function testProviderConnection(
  { apiKey, settings }: TestProviderConnectionParams,
  fetchFn: FetchLike = fetch
): Promise<TestProviderConnectionResult> {
  const resolvedApiKey = apiKey?.trim();

  if (resolvedApiKey === undefined || resolvedApiKey.length === 0) {
    return {
      ok: false,
      message: "Enter or save an API key before testing."
    };
  }

  if (settings.providerType === "compatible") {
    return testCompatibleProviderConnection(settings, resolvedApiKey, fetchFn);
  }

  return testDirectProviderConnection(settings.providerType, resolvedApiKey, fetchFn);
}

async function testCompatibleProviderConnection(settings: CommitSettings, apiKey: string, fetchFn: FetchLike) {
  try {
    await fetchModelList({ apiKey, settings }, fetchFn);

    return {
      ok: true,
      message: "Connection verified with the provider models endpoint."
    };
  } catch {
    return {
      ok: false,
      message: "Unable to verify the provider connection. Check the API key and base URL."
    };
  }
}

async function testDirectProviderConnection(providerType: Exclude<CommitSettings["providerType"], "compatible">, apiKey: string, fetchFn: FetchLike) {
  const providerCheck = directProviderChecks[providerType];

  try {
    const response = await fetchFn(providerCheck.request(apiKey));

    if (response.ok) {
      return {
        ok: true,
        message: `Connection verified with ${providerCheck.label}.`
      };
    }

    return {
      ok: false,
      message:
        response.status === 401 || response.status === 403
          ? `Unable to verify ${providerCheck.label}. Check the API key.`
          : `Unable to verify ${providerCheck.label}. Provider returned HTTP ${response.status}.`
    };
  } catch {
    return {
      ok: false,
      message: `Unable to reach ${providerCheck.label}. Check your network connection.`
    };
  }
}
