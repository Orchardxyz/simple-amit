import * as assert from "assert";
import { getApiKeyDraft, saveApiKeyDraft } from "../webview/lib/apiKeyDrafts";
import { validSettings } from "./testFixtures";

suite("API key drafts", () => {
  test("stores drafts by provider", () => {
    const drafts = saveApiKeyDraft(
      saveApiKeyDraft(
        saveApiKeyDraft({}, { ...validSettings, providerType: "anthropic" }, "anthropic-key"),
        { ...validSettings, providerType: "gemini" },
        "gemini-key"
      ),
      { ...validSettings, providerType: "compatible", compatibleProviderId: "deepseek" },
      "deepseek-key"
    );

    assert.strictEqual(getApiKeyDraft(drafts, { ...validSettings, providerType: "anthropic" }), "anthropic-key");
    assert.strictEqual(getApiKeyDraft(drafts, { ...validSettings, providerType: "gemini" }), "gemini-key");
    assert.strictEqual(getApiKeyDraft(drafts, { ...validSettings, providerType: "compatible", compatibleProviderId: "deepseek" }), "deepseek-key");
    assert.strictEqual(getApiKeyDraft(drafts, { ...validSettings, providerType: "compatible", compatibleProviderId: "openai" }), undefined);
  });

  test("preserves intentionally empty drafts", () => {
    const drafts = saveApiKeyDraft({}, { ...validSettings, providerType: "compatible", compatibleProviderId: "deepseek" }, "");

    assert.strictEqual(getApiKeyDraft(drafts, { ...validSettings, providerType: "compatible", compatibleProviderId: "deepseek" }), "");
  });
});
