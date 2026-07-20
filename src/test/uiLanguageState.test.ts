import * as assert from "assert";
import { getUiLanguage, saveUiLanguage, uiLanguageGlobalStateKey } from "../globalState/uiLanguageState";
import { FakeMemento } from "./testFixtures";

suite("UI language global state", () => {
  test("returns English when no language is saved", () => {
    const globalState = new FakeMemento();

    assert.strictEqual(getUiLanguage(globalState), "en");
  });

  test("saves and reads simplified Chinese", async () => {
    const globalState = new FakeMemento();

    await saveUiLanguage(globalState, "zh-CN");

    assert.strictEqual(getUiLanguage(globalState), "zh-CN");
  });

  test("falls back to English when the saved language is invalid", async () => {
    const globalState = new FakeMemento();
    await globalState.update(uiLanguageGlobalStateKey, "fr");

    assert.strictEqual(getUiLanguage(globalState), "en");
  });
});
