import type { StatusResult } from "simple-git";
import type * as vscode from "vscode";

export const validSettings = {
  providerType: "compatible",
  compatibleProviderId: "openai",
  baseUrl: "https://api.openai.com",
  model: "gpt-4.1-mini",
  models: {
    anthropic: "",
    gemini: "",
    compatible: {
      openai: "gpt-4.1-mini"
    }
  },
  language: "en",
  instructions: "Generate a concise commit message."
} as const;

export class FakeSecretStorage implements vscode.SecretStorage {
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

export class FakeMemento implements vscode.Memento {
  private readonly values = new Map<string, unknown>();

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.values.has(key) ? (this.values.get(key) as T) : defaultValue;
  }

  keys(): readonly string[] {
    return [...this.values.keys()];
  }

  setKeysForSync(_keys: readonly string[]): void {}

  async update(key: string, value: unknown): Promise<void> {
    if (value === undefined) {
      this.values.delete(key);
      return;
    }

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

export class FakeSimpleGit {
  constructor(private readonly options: FakeSimpleGitOptions) {}

  async diff(args: string[] = []): Promise<string> {
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

  async status(): Promise<StatusResult> {
    return this.options.status;
  }
}

export function createFakeStatus(overrides: Partial<StatusResult> = {}): StatusResult {
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
