import * as assert from "assert";
import { createModelListUrl, fetchModelList } from "../providers/modelList";
import { validSettings } from "./testFixtures";

suite("Provider model list", () => {
  test("builds OpenAI-compatible model-list URLs from provider settings", () => {
    assert.strictEqual(
      createModelListUrl({ ...validSettings, compatibleProviderId: "deepseek", baseUrl: "https://api.deepseek.com/" }),
      "https://api.deepseek.com/models"
    );

    assert.strictEqual(
      createModelListUrl({ ...validSettings, compatibleProviderId: "openai", baseUrl: "https://api.openai.com" }),
      "https://api.openai.com/v1/models"
    );
  });

  test("fetches and normalizes OpenAI-compatible model ids", async () => {
    const fetchFn: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "deepseek-chat" }, { id: "deepseek-reasoner" }, { id: "deepseek-chat" }]
        }),
        { status: 200 }
      );

    const result = await fetchModelList(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, compatibleProviderId: "deepseek", baseUrl: "https://api.deepseek.com" }
      },
      fetchFn
    );

    assert.deepStrictEqual(result.models, ["deepseek-chat", "deepseek-reasoner"]);
  });
});
