import * as assert from "assert";
import { normalizeAgentOutput } from "../commit/commitMessageAgent";

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
