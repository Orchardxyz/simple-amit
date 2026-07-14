import type { CompatibleProviderId, ProviderType } from "../../shared/commitSettings";

const compatibleModels: Partial<Record<CompatibleProviderId, string[]>> = {
  dashscope: ["qwen-plus", "qwen-max", "qwen-turbo", "qwen3-235b-a22b"],
  deepseek: ["deepseek-chat", "deepseek-reasoner", "deepseek-v3", "deepseek-r1"],
  doubao: ["doubao-1-5-pro-32k", "doubao-1-5-lite-32k"],
  groq: ["llama-3.3-70b-versatile", "qwen-qwq-32b"],
  minimax: ["MiniMax-M2.5", "MiniMax-M2.1"],
  "minimax-global": ["MiniMax-M2.5", "MiniMax-M2.1"],
  modelscope: ["Qwen/Qwen3-32B", "deepseek-ai/DeepSeek-V3.2"],
  moonshot: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  openai: ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "o3", "o4-mini", "gpt-4.1-nano"],
  silicon: ["deepseek-ai/DeepSeek-V3", "Qwen/Qwen3-32B"],
  zai: ["glm-4.7", "glm-4.5-air", "glm-4-flash"],
  zhipu: ["glm-4-plus", "glm-4-air", "glm-4-flash"]
};

const directProviderModels: Record<Exclude<ProviderType, "compatible">, string[]> = {
  anthropic: ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5"],
  gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"]
};

export function getStaticModelOptions(providerType: ProviderType, compatibleProviderId: CompatibleProviderId) {
  if (providerType !== "compatible") {
    return directProviderModels[providerType];
  }

  return compatibleModels[compatibleProviderId] ?? [];
}
