import * as assert from "assert";
import { runCommitMessageGeneration } from "../commit/commitMessageCommand";
import { createFakeStatus, FakeSimpleGit } from "./testFixtures";
import type { CommitMessageResult } from "../commit/commitMessageAgent";
import type { SimpleGit } from "simple-git";

const result: CommitMessageResult = {
  diffScopeUsed: "staged",
  languageVerdict: {
    actualLanguage: "en",
    expectedLanguage: "en",
    matches: true,
    reason: ""
  },
  message: "feat(commit): add cancellation"
};

suite("Commit message generation cancellation", () => {
  test("does not write a result that arrives after cancellation", async () => {
    const controller = new AbortController();
    let resolveGeneration!: (value: CommitMessageResult) => void;
    let startedGeneration!: () => void;
    const generationStarted = new Promise<void>((resolve) => (startedGeneration = resolve));
    const generation = new Promise<CommitMessageResult>((resolve) => (resolveGeneration = resolve));
    const writes: string[] = [];
    const git = new FakeSimpleGit({ status: createFakeStatus({ staged: ["src/commit.ts"] }) });

    const pending = runCommitMessageGeneration({
      git: git as unknown as SimpleGit,
      signal: controller.signal,
      generate: () => {
        startedGeneration();
        return generation;
      },
      writeMessage: (message) => writes.push(message)
    });

    await generationStarted;
    controller.abort();
    resolveGeneration(result);

    await assert.rejects(pending);
    assert.deepStrictEqual(writes, []);
  });

  test("does not start generation after cancellation during Git status", async () => {
    const controller = new AbortController();
    let resolveStatus!: (value: ReturnType<typeof createFakeStatus>) => void;
    const status = new Promise<ReturnType<typeof createFakeStatus>>((resolve) => (resolveStatus = resolve));
    let generated = false;
    const writes: string[] = [];

    const pending = runCommitMessageGeneration({
      git: { status: () => status } as unknown as SimpleGit,
      signal: controller.signal,
      generate: async () => {
        generated = true;
        return result;
      },
      writeMessage: (message) => writes.push(message)
    });

    controller.abort();
    resolveStatus(createFakeStatus({ staged: ["src/commit.ts"] }));

    await assert.rejects(pending);
    assert.strictEqual(generated, false);
    assert.deepStrictEqual(writes, []);
  });

  test("writes exactly once on successful generation", async () => {
    const writes: string[] = [];
    const git = new FakeSimpleGit({ status: createFakeStatus({ staged: ["src/commit.ts"] }) });

    const outcome = await runCommitMessageGeneration({
      git: git as unknown as SimpleGit,
      signal: new AbortController().signal,
      generate: async () => result,
      writeMessage: (message) => writes.push(message)
    });

    assert.strictEqual(outcome, "generated");
    assert.deepStrictEqual(writes, [result.message]);
  });
});
