import * as assert from "assert";
import { testProviderConnection } from "../providers/connectionTest";
import { validSettings } from "./testFixtures";

suite("Provider connection test", () => {
  test("returns a failed result when API key is missing", async () => {
    const result = await testProviderConnection({
      settings: validSettings
    });

    assert.deepStrictEqual(result, {
      ok: false,
      message: "Enter or save an API key before testing."
    });
  });

  test("verifies OpenAI-compatible providers with the models endpoint", async () => {
    const fetchFn: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "deepseek-chat" }]
        }),
        { status: 200 }
      );

    const result = await testProviderConnection(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, compatibleProviderId: "deepseek", baseUrl: "https://api.deepseek.com" }
      },
      fetchFn
    );

    assert.deepStrictEqual(result, {
      ok: true,
      message: "Connection verified with the provider models endpoint."
    });
  });

  test("reports OpenAI-compatible provider verification failures", async () => {
    const fetchFn: typeof fetch = async () => new Response("Unauthorized", { status: 401 });

    const result = await testProviderConnection(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, compatibleProviderId: "deepseek", baseUrl: "https://api.deepseek.com" }
      },
      fetchFn
    );

    assert.deepStrictEqual(result, {
      ok: false,
      message: "Unable to verify the provider connection. Check the API key and base URL."
    });
  });

  test("verifies Anthropic with a low-cost auth probe", async () => {
    let requestUrl = "";
    let apiKeyHeader = "";
    const fetchFn: typeof fetch = async (input) => {
      const request = new Request(input);
      requestUrl = request.url;
      apiKeyHeader = request.headers.get("x-api-key") ?? "";

      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    };

    const result = await testProviderConnection(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, providerType: "anthropic" }
      },
      fetchFn
    );

    assert.strictEqual(requestUrl, "https://api.anthropic.com/v1/models");
    assert.strictEqual(apiKeyHeader, "secret-key");
    assert.deepStrictEqual(result, {
      ok: true,
      message: "Connection verified with Anthropic."
    });
  });

  test("reports Anthropic auth probe failures", async () => {
    const fetchFn: typeof fetch = async () => new Response("Unauthorized", { status: 401 });

    const result = await testProviderConnection(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, providerType: "anthropic" }
      },
      fetchFn
    );

    assert.deepStrictEqual(result, {
      ok: false,
      message: "Unable to verify Anthropic. Check the API key."
    });
  });

  test("verifies Gemini with a low-cost auth probe", async () => {
    let requestUrl = "";
    let apiKeyHeader = "";
    const fetchFn: typeof fetch = async (input) => {
      const request = new Request(input);
      requestUrl = request.url;
      apiKeyHeader = request.headers.get("x-goog-api-key") ?? "";

      return new Response(JSON.stringify({ models: [] }), { status: 200 });
    };

    const result = await testProviderConnection(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, providerType: "gemini" }
      },
      fetchFn
    );

    assert.strictEqual(requestUrl, "https://generativelanguage.googleapis.com/v1beta/models");
    assert.strictEqual(apiKeyHeader, "secret-key");
    assert.deepStrictEqual(result, {
      ok: true,
      message: "Connection verified with Gemini."
    });
  });

  test("reports Gemini auth probe failures", async () => {
    const fetchFn: typeof fetch = async () => new Response("Forbidden", { status: 403 });

    const result = await testProviderConnection(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, providerType: "gemini" }
      },
      fetchFn
    );

    assert.deepStrictEqual(result, {
      ok: false,
      message: "Unable to verify Gemini. Check the API key."
    });
  });
});
