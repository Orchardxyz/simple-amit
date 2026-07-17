import { z } from "zod";
import { type CommitMessageLanguage, type CommitSettings } from "../shared/commitSettings";
import { createGitTools, type DiffScope } from "./gitTools";
import type { LanguageModel } from "ai" with { "resolution-mode": "import" };
import type { SimpleGit } from "simple-git";

const languageVerdictSchema = z.object({
  actualLanguage: z.string(),
  expectedLanguage: z.enum(["zh-CN", "en"]),
  matches: z.boolean(),
  reason: z.string()
});

const agentCommitMessageOutputSchema = z.object({
  commitMessage: z.string().optional(),
  diffScopeUsed: z.enum(["staged", "unstaged", "all"]).optional(),
  languageVerdict: z
    .object({
      actualLanguage: z.string().optional(),
      expectedLanguage: z.enum(["zh-CN", "en"]).optional(),
      matches: z.boolean().optional(),
      reason: z.string().optional()
    })
    .optional(),
  message: z.string().optional()
});

export const commitMessageResultSchema = z.object({
  diffScopeUsed: z.enum(["staged", "unstaged", "all"]),
  languageVerdict: languageVerdictSchema,
  message: z.string().min(1)
});

export type CommitMessageResult = z.infer<typeof commitMessageResultSchema>;

export type GenerateCommitMessageAgentOptions = {
  git: SimpleGit;
  model: LanguageModel;
  repositoryRoot: string;
  settings: CommitSettings;
};

export async function generateCommitMessageWithAgent(options: GenerateCommitMessageAgentOptions): Promise<CommitMessageResult> {
  const agent = await createCommitMessageAgent(options);
  const firstResult = await runAgent(agent, createGenerationPrompt(options.settings.language), options.settings.language);

  if (firstResult.languageVerdict.matches) {
    return firstResult;
  }

  const repairedResult = await runAgent(agent, createRepairPrompt(options.settings.language, firstResult.message), options.settings.language);

  if (!repairedResult.languageVerdict.matches) {
    throw new Error("Generated commit message did not match the configured language.");
  }

  return repairedResult;
}

async function createCommitMessageAgent({ git, model, repositoryRoot, settings }: GenerateCommitMessageAgentOptions): Promise<AgentLike> {
  setVoltAgentProductionDefault();
  const { Agent } = await import("@voltagent/core");

  return new Agent({
    instructions: createAgentInstructions(settings),
    maxSteps: 6,
    model,
    name: "Simple Amit Commit Message Agent",
    tools: await createGitTools(git, repositoryRoot)
  }) as unknown as AgentLike;
}

type AgentLike = {
  generateText(prompt: string, options: { output: unknown }): Promise<{ output: unknown }>;
};

async function runAgent(agent: AgentLike, prompt: string, language: CommitMessageLanguage) {
  const { Output } = await import("ai");
  const result = await agent.generateText(prompt, {
    output: Output.object({ schema: agentCommitMessageOutputSchema })
  });

  return normalizeAgentOutput(agentCommitMessageOutputSchema.parse(result.output), language);
}

function createAgentInstructions(settings: CommitSettings) {
  return `You are Simple Amit's commit-message agent.

Your job is to generate exactly one Git commit message.

Rules:
- Inspect repository status before choosing which diff to read.
- Choose the diff scope from the user's commit instructions.
- If the instructions do not specify scope, prefer staged changes when staged changes exist; otherwise inspect unstaged changes.
- Call get_workspace_diff with exactly one scope: staged, unstaged, or all.
- Use recent commits only to learn style, format, language, type, scope, and tone.
- Do not copy unrelated prior commit content.
- Do not invent details that are not present in tool results.
- Use the configured target language: ${settings.language}.
- Return structured output matching the schema as a valid JSON object.
- The JSON object must include a non-empty "message" string.
- The JSON object should use this shape:
  {
    "message": "type(scope): concise subject",
    "diffScopeUsed": "staged",
    "languageVerdict": {
      "actualLanguage": "${settings.language}",
      "expectedLanguage": "${settings.language}",
      "matches": true,
      "reason": "The message uses the configured target language."
    }
  }

User commit instructions:
${settings.instructions}`;
}

function createGenerationPrompt(language: CommitMessageLanguage) {
  return `Generate a commit message for the current repository.

First inspect repository status.
Then inspect the appropriate diff scope based on the instructions.
Use recent commit history only for style.
Return only a valid JSON object containing "message", "diffScopeUsed", and "languageVerdict" for ${language}.`;
}

function createRepairPrompt(language: CommitMessageLanguage, message: string) {
  return `The previous message did not match the target language.

Target language:
${language}

Original message:
${message}

Rewrite the commit message in the target language.
Preserve the commit type, scope, and meaning.
Return the same structured schema as a valid JSON object.
Return only JSON. Do not include markdown fences or extra prose.
Set diffScopeUsed to the same scope used for the original generation if known; otherwise choose the scope you inspected.`;
}

export function isDiffScope(value: string): value is DiffScope {
  return value === "staged" || value === "unstaged" || value === "all";
}

function setVoltAgentProductionDefault() {
  process.env.NODE_ENV ??= "production";
}

export function normalizeAgentOutput(output: z.infer<typeof agentCommitMessageOutputSchema>, language: CommitMessageLanguage): CommitMessageResult {
  const message = (output.message ?? output.commitMessage ?? "").trim();

  if (message.length === 0) {
    throw new Error("Generated JSON did not include a non-empty commit message.");
  }

  const inferredMatches = messageMatchesLanguage(message, language);
  const verdict = output.languageVerdict;

  return commitMessageResultSchema.parse({
    diffScopeUsed: output.diffScopeUsed ?? "all",
    languageVerdict: {
      actualLanguage: verdict?.actualLanguage ?? inferLanguageLabel(message),
      expectedLanguage: language,
      matches: verdict?.matches ?? inferredMatches,
      reason: verdict?.reason ?? createLanguageVerdictReason(language, inferredMatches)
    },
    message
  });
}

function messageMatchesLanguage(message: string, language: CommitMessageLanguage) {
  const containsCjk = /[\u3400-\u9fff]/.test(message);

  if (language === "zh-CN") {
    return containsCjk;
  }

  return !containsCjk;
}

function inferLanguageLabel(message: string) {
  return /[\u3400-\u9fff]/.test(message) ? "zh-CN" : "en";
}

function createLanguageVerdictReason(language: CommitMessageLanguage, matches: boolean) {
  if (matches) {
    return `The message appears to match ${language}.`;
  }

  return `The message does not appear to match ${language}.`;
}
