export const uiLanguages = ["en", "zh-CN"] as const;
export const defaultUiLanguage: UiLanguage = "en";

export type UiLanguage = (typeof uiLanguages)[number];

export function isUiLanguage(value: unknown): value is UiLanguage {
  return uiLanguages.includes(value as UiLanguage);
}
