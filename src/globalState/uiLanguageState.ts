import { defaultUiLanguage, isUiLanguage, type UiLanguage } from "../shared/uiLanguage";
import type * as vscode from "vscode";

export const uiLanguageGlobalStateKey = "simple-amit.uiLanguage";

export function getUiLanguage(globalState: vscode.Memento): UiLanguage {
  const language = globalState.get(uiLanguageGlobalStateKey);

  return isUiLanguage(language) ? language : defaultUiLanguage;
}

export async function saveUiLanguage(globalState: vscode.Memento, language: UiLanguage): Promise<UiLanguage> {
  await globalState.update(uiLanguageGlobalStateKey, language);

  return language;
}
