import * as assert from "assert";
import { resolveCommitSettings } from "../settings/commitSettingsRepository";
import { defaultInstructions } from "../shared/commitSettings";
import { BridgeErrorCode, BridgeMethod, isBridgeRequest, isBridgeResponse } from "../shared/webviewProtocol";

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
