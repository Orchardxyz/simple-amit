import * as assert from "assert";
import { createWorkspaceDiffPayload } from "../commit/gitTools";
import { createFakeStatus, FakeSimpleGit } from "./testFixtures";
import type { SimpleGit } from "simple-git";

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
