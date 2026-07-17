import * as assert from "assert";
import { normalizeAgentOutput } from "../commit/commitMessageAgent";
import { createWorkspaceDiffPayload } from "../commit/gitTools";
import { createModelListUrl, fetchModelList } from "../providers/modelList";
import { createApiKeyStore, getApiKeySecretKey } from "../settings/apiKeyStore";
import { resolveCommitSettings } from "../settings/commitSettingsRepository";
import { defaultInstructions } from "../shared/commitSettings";
import { BridgeErrorCode, BridgeMethod, isBridgeRequest, isBridgeResponse } from "../shared/webviewProtocol";
import type { SimpleGit, StatusResult } from "simple-git";
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

suite("Commit message agent output", () => {
  test("normalizes loose model JSON into the internal result shape", () => {
    const result = normalizeAgentOutput(
      {
        commitMessage: "feat(settings): 支持读取已保存 API key"
      },
      "zh-CN"
    );

    assert.strictEqual(result.message, "feat(settings): 支持读取已保存 API key");
    assert.strictEqual(result.diffScopeUsed, "all");
    assert.strictEqual(result.languageVerdict.expectedLanguage, "zh-CN");
    assert.strictEqual(result.languageVerdict.matches, true);
  });
});

suite("Git diff tools", () => {
  test("returns only staged diff data for staged scope", async () => {
    const git = new FakeSimpleGit({
      stagedDiff: "diff --git a/src/a.ts b/src/a.ts\n@@ -1 +1 @@\n-old\n+new",
      stagedNumstat: "1\t1\tsrc/a.ts",
      status: createFakeStatus({
        staged: ["src/a.ts"],
        modified: ["src/b.ts"]
      }),
      unstagedDiff: "diff --git a/src/b.ts b/src/b.ts\n@@ -1 +1 @@\n-old\n+new",
      unstagedNumstat: "1\t1\tsrc/b.ts"
    });

    const payload = await createWorkspaceDiffPayload(git as unknown as SimpleGit, "staged");

    assert.deepStrictEqual(
      payload.files.map((file) => file.path),
      ["src/a.ts"]
    );
    assert.strictEqual(payload.scope, "staged");
    assert.strictEqual(payload.files[0].patch?.includes("src/a.ts"), true);
  });

  test("omits lockfile patches while keeping file summary", async () => {
    const git = new FakeSimpleGit({
      stagedDiff: "diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml\n@@ -1 +1 @@\n-old\n+new",
      stagedNumstat: "1\t1\tpnpm-lock.yaml",
      status: createFakeStatus({
        staged: ["pnpm-lock.yaml"]
      })
    });

    const payload = await createWorkspaceDiffPayload(git as unknown as SimpleGit, "staged");

    assert.strictEqual(payload.files[0].path, "pnpm-lock.yaml");
    assert.strictEqual(payload.files[0].omittedReason, "lockfile");
    assert.strictEqual(payload.files[0].patch, undefined);
  });
});

suite("Provider model list", () => {
  test("builds OpenAI-compatible model-list URLs from provider settings", () => {
    assert.strictEqual(
      createModelListUrl({ ...validSettings, compatibleProviderId: "deepseek", baseUrl: "https://api.deepseek.com/" }),
      "https://api.deepseek.com/models"
    );
  });

  test("fetches and normalizes OpenAI-compatible model ids", async () => {
    const result = await fetchModelList(
      {
        apiKey: "secret-key",
        settings: { ...validSettings, compatibleProviderId: "deepseek", baseUrl: "https://api.deepseek.com" }
      },
      async () =>
        new Response(
          JSON.stringify({
            data: [{ id: "deepseek-chat" }, { id: "deepseek-reasoner" }, { id: "deepseek-chat" }]
          }),
          { status: 200 }
        )
    );

    assert.deepStrictEqual(result.models, ["deepseek-chat", "deepseek-reasoner"]);
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

type FakeSimpleGitOptions = {
  stagedDiff?: string;
  stagedNumstat?: string;
  status: StatusResult;
  unstagedDiff?: string;
  unstagedNumstat?: string;
};

class FakeSimpleGit {
  constructor(private readonly options: FakeSimpleGitOptions) {}

  async diff(args: string[] = []) {
    if (args.includes("--cached") && args.includes("--numstat")) {
      return this.options.stagedNumstat ?? "";
    }

    if (args.includes("--cached")) {
      return this.options.stagedDiff ?? "";
    }

    if (args.includes("--numstat")) {
      return this.options.unstagedNumstat ?? "";
    }

    return this.options.unstagedDiff ?? "";
  }

  async status() {
    return this.options.status;
  }
}

function createFakeStatus(overrides: Partial<StatusResult> = {}): StatusResult {
  return {
    ahead: 0,
    behind: 0,
    conflicted: [],
    created: [],
    current: "main",
    deleted: [],
    detached: false,
    files: [],
    isClean: () => false,
    modified: [],
    not_added: [],
    renamed: [],
    staged: [],
    tracking: null,
    ...overrides
  };
}
