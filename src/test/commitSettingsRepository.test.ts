import * as assert from "assert";
import { readFileSync } from "fs";
import { resolve } from "path";
import { resolveCommitSettings } from "../settings/commitSettingsRepository";
import { defaultInstructions, getCurrentProviderModel, saveCurrentProviderModel } from "../shared/commitSettings";

suite("Commit settings repository", () => {
  test("formats useful commit bodies as concise bullet points", () => {
    assert.strictEqual(defaultInstructions.includes("format it as concise hyphen-prefixed bullet points"), true);
    assert.strictEqual(defaultInstructions.includes("one distinct change or rationale per bullet"), true);
    assert.strictEqual(defaultInstructions.includes("Use a short paragraph only when"), true);
  });

  test("keeps the extension manifest instruction default in sync", () => {
    const manifest = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf8")) as {
      contributes: {
        configuration: {
          properties: Record<string, { default: string }>;
        };
      };
    };

    assert.strictEqual(manifest.contributes.configuration.properties["simple-amit.instructions"].default, defaultInstructions);
  });

  test("fills missing and invalid values with defaults", () => {
    const defaults = {
      providerType: "compatible",
      compatibleProviderId: "openai",
      baseUrl: "https://api.openai.com",
      model: "",
      models: {
        anthropic: "",
        gemini: "",
        compatible: {}
      },
      language: "en",
      instructions: defaultInstructions
    } as const;
    const settings = resolveCommitSettings(
      {
        providerType: "ollama",
        compatibleProviderId: "deepseek",
        baseUrl: 42,
        models: {
          anthropic: "claude-sonnet-4-5",
          gemini: "gemini-2.5-flash",
          compatible: {
            deepseek: "deepseek-chat"
          }
        },
        language: "fr",
        instructions: undefined
      },
      defaults
    );

    assert.strictEqual(settings.providerType, defaults.providerType);
    assert.strictEqual(settings.compatibleProviderId, "deepseek");
    assert.strictEqual(settings.baseUrl, defaults.baseUrl);
    assert.strictEqual(settings.model, "deepseek-chat");
    assert.deepStrictEqual(settings.models, {
      anthropic: "claude-sonnet-4-5",
      gemini: "gemini-2.5-flash",
      compatible: {
        deepseek: "deepseek-chat"
      }
    });
    assert.strictEqual(settings.language, defaults.language);
    assert.strictEqual(settings.instructions, defaultInstructions);
  });

  test("resolves direct provider models from provider-specific storage", () => {
    const defaults = {
      providerType: "compatible",
      compatibleProviderId: "openai",
      baseUrl: "https://api.openai.com",
      model: "",
      models: {
        anthropic: "",
        gemini: "",
        compatible: {}
      },
      language: "en",
      instructions: defaultInstructions
    } as const;
    const settings = resolveCommitSettings(
      {
        providerType: "anthropic",
        compatibleProviderId: "deepseek",
        baseUrl: "https://api.deepseek.com",
        models: {
          anthropic: "claude-sonnet-4-5",
          gemini: "gemini-2.5-flash",
          compatible: {
            deepseek: "deepseek-chat"
          }
        },
        language: "en",
        instructions: "Generate a concise commit message."
      },
      defaults
    );

    assert.strictEqual(settings.model, "claude-sonnet-4-5");
  });

  test("stores and restores models per selected provider", () => {
    const settings = resolveCommitSettings({
      providerType: "compatible",
      compatibleProviderId: "deepseek",
      baseUrl: "https://api.deepseek.com",
      models: {
        anthropic: "claude-sonnet-4-5",
        gemini: "gemini-2.5-flash",
        compatible: {
          openai: "gpt-4.1-mini"
        }
      },
      language: "en",
      instructions: "Generate a concise commit message."
    });
    const nextModels = saveCurrentProviderModel({
      ...settings,
      model: "deepseek-v4-flash"
    });

    assert.strictEqual(
      getCurrentProviderModel({
        providerType: "compatible",
        compatibleProviderId: "openai",
        models: nextModels
      }),
      "gpt-4.1-mini"
    );
    assert.strictEqual(
      getCurrentProviderModel({
        providerType: "anthropic",
        compatibleProviderId: "openai",
        models: nextModels
      }),
      "claude-sonnet-4-5"
    );
    assert.strictEqual(
      getCurrentProviderModel({
        providerType: "compatible",
        compatibleProviderId: "deepseek",
        models: nextModels
      }),
      "deepseek-v4-flash"
    );
  });
});
