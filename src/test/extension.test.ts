import * as assert from "assert";
import { BridgeErrorCode, BridgeMethod, isBridgeRequest, isBridgeResponse } from "../shared/webviewProtocol.js";

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
