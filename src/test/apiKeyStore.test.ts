import * as assert from "assert";
import { createApiKeyStore, getApiKeySecretKey } from "../settings/apiKeyStore";
import { FakeSecretStorage, validSettings } from "./testFixtures";

suite("API key store", () => {
  test("stores and deletes API keys", async () => {
    const secrets = new FakeSecretStorage();
    const apiKeyStore = createApiKeyStore(secrets);

    assert.strictEqual(await apiKeyStore.hasApiKey(validSettings), false);

    await apiKeyStore.saveApiKey(validSettings, "secret-key");
    assert.strictEqual(await apiKeyStore.hasApiKey(validSettings), true);
    assert.strictEqual(await apiKeyStore.getApiKey(validSettings), "secret-key");
    assert.strictEqual(await secrets.get(getApiKeySecretKey(validSettings)), "secret-key");

    await apiKeyStore.deleteApiKey(validSettings);
    assert.strictEqual(await apiKeyStore.hasApiKey(validSettings), false);
    assert.strictEqual(await apiKeyStore.getApiKey(validSettings), undefined);
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
