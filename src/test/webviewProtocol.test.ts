import * as assert from "assert";
import { BridgeErrorCode, BridgeMethod, isBridgeRequest, isBridgeResponse } from "../shared/webviewProtocol";
import { validSettings } from "./testFixtures";

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

  test("accepts model-list fetch request shapes", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.FetchModelList,
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
        method: BridgeMethod.FetchModelList,
        params: {
          settings: validSettings
        }
      }),
      true
    );
  });

  test("accepts provider connection test request shapes", () => {
    assert.strictEqual(
      isBridgeRequest({
        type: "request",
        id: "request-1",
        method: BridgeMethod.TestProviderConnection,
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
        method: BridgeMethod.TestProviderConnection,
        params: {
          settings: validSettings
        }
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

  test("accepts API-key status responses with secret values", () => {
    const response = {
      type: "response",
      id: "request-1",
      ok: true,
      result: {
        apiKey: {
          apiKey: "secret-key",
          hasSavedKey: true
        }
      }
    } as const;

    assert.strictEqual(isBridgeResponse(response), true);
    assert.deepStrictEqual(response.result.apiKey, {
      apiKey: "secret-key",
      hasSavedKey: true
    });
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
