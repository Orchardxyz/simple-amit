import * as assert from "assert";
import { createApiKeyStore, getApiKeySecretKey } from "../settings/apiKeyStore";
import { resolveCommitSettings } from "../settings/commitSettingsRepository";
import { defaultInstructions } from "../shared/commitSettings";
import { BridgeErrorCode, BridgeMethod, isBridgeRequest, isBridgeResponse } from "../shared/webviewProtocol";
import type * as vscode from "vscode";

const validSettings = {
  providerType: "compatible",
  compatibleProviderId: "openai",
  baseUrl: "https://api.openai.com",
  model: "gpt-4.1-mini",
  language: "en",
  instructions: "Generate a concise commit message."
} as const;

suite("Webview bridge protocol", () => {
  test("accepts the get-initial-state request shape", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.GetInitialState,
        params: undefined
      }),
      true
    );
  });

  test("rejects invalid request parameters", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.GetInitialState,
        params: {}
      }),
      false
    );
  });

  test("accepts the save-settings request shape", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.SaveSettings,
        params: validSettings
      }),
      true
    );
  });

  test("accepts the reset-settings request shape", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.ResetSettings,
        params: undefined
      }),
      true
    );
  });

  test("accepts API-key request shapes", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.SaveApiKey,
        params: {
          apiKey: "secret-key",
          settings: validSettings
        }
      }),
      true
    );

    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-2",
        method: BridgeMethod.ClearApiKey,
        params: validSettings
      }),
      true
    );

    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-3",
        method: BridgeMethod.GetApiKeyStatus,
        params: validSettings
      }),
      true
    );
  });

  test("rejects invalid API-key request parameters", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.SaveApiKey,
        params: {
          apiKey: "",
          settings: validSettings
        }
      }),
      false
    );

    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-2",
        method: BridgeMethod.SaveApiKey,
        params: {
          apiKey: "secret-key",
          settings: {
            ...validSettings,
            providerType: "ollama"
          }
        }
      }),
      false
    );
  });

  test("rejects invalid save-settings parameters", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.SaveSettings,
        params: {
          ...validSettings,
          language: "fr"
        }
      }),
      false
    );

    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-2",
        method: BridgeMethod.SaveSettings,
        params: {
          ...validSettings,
          providerType: "ollama"
        }
      }),
      false
    );
  });

  test("accepts API-key status responses without secret values", () => {
    const response = {
      type: "response",
      id: "request-1",
      ok: true,
      result: {
        apiKey: {
          hasSavedKey: true
        }
      }
    } as const;

    assert.strictEqual(isBridgeResponse(response), true);
    assert.deepStrictEqual(Object.keys(response.result.apiKey), ["hasSavedKey"]);
  });

  test("accepts numeric error codes in failure responses", () => {
    assert.strictEqual(
      isBridgeResponse({
        type: "response",
        id: "request-1",
        ok: false,
        error: {
          code: BridgeErrorCode.InvalidMessage,
          message: "Invalid message."
        }
      }),
      true
    );
  });
});

suite("Commit settings repository", () => {
  test("fills missing and invalid values with defaults", () => {
    const defaults = {
      providerType: "compatible",
      compatibleProviderId: "openai",
      baseUrl: "https://api.openai.com",
      model: "",
      language: "en",
      instructions: defaultInstructions
    } as const;
    const settings = resolveCommitSettings(
      {
        providerType: "ollama",
        compatibleProviderId: "deepseek",
        baseUrl: 42,
        model: "deepseek-chat",
        language: "fr",
        instructions: undefined
      },
      defaults
    );

    assert.strictEqual(settings.providerType, defaults.providerType);
    assert.strictEqual(settings.compatibleProviderId, "deepseek");
    assert.strictEqual(settings.baseUrl, defaults.baseUrl);
    assert.strictEqual(settings.model, "deepseek-chat");
    assert.strictEqual(settings.language, defaults.language);
    assert.strictEqual(settings.instructions, defaultInstructions);
  });
});

suite("API key store", () => {
  test("stores and deletes API keys", async () => {
    const secrets = new FakeSecretStorage();
    const apiKeyStore = createApiKeyStore(secrets);

    assert.strictEqual(await apiKeyStore.hasApiKey(validSettings), false);

    await apiKeyStore.saveApiKey(validSettings, "secret-key");
    assert.strictEqual(await apiKeyStore.hasApiKey(validSettings), true);
    assert.strictEqual(await secrets.get(getApiKeySecretKey(validSettings)), "secret-key");

    await apiKeyStore.deleteApiKey(validSettings);
    assert.strictEqual(await apiKeyStore.hasApiKey(validSettings), false);
  });

  test("uses distinct secret keys for each provider", () => {
    assert.strictEqual(getApiKeySecretKey({ ...validSettings, providerType: "anthropic" }), "simple-amit.apiKey.anthropic");
    assert.strictEqual(getApiKeySecretKey({ ...validSettings, providerType: "gemini" }), "simple-amit.apiKey.gemini");
    assert.strictEqual(
      getApiKeySecretKey({ ...validSettings, providerType: "compatible", compatibleProviderId: "deepseek" }),
      "simple-amit.apiKey.compatible:deepseek"
    );
  });
});

class FakeSecretStorage implements vscode.SecretStorage {
  private readonly values = new Map<string, string>();

  readonly onDidChange: vscode.Event<vscode.SecretStorageChangeEvent> = () => ({
    dispose() {}
  });

  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }

  async get(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  async keys(): Promise<string[]> {
    return [...this.values.keys()];
  }

  async store(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}
