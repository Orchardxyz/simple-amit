import simpleGit, { type SimpleGit, type StatusResult } from "simple-git";
import { z } from "zod";

export const diffScopes = ["staged", "unstaged", "all"] as const;

export type DiffScope = (typeof diffScopes)[number];

export type WorkspaceDiffFile = {
  additions?: number;
  deletions?: number;
  omittedReason?: "binary" | "generated" | "lockfile" | "too_large";
  patch?: string;
  path: string;
  status: string;
};

export type WorkspaceDiffPayload = {
  files: WorkspaceDiffFile[];
  scope: DiffScope;
  statusSummary: string;
  truncated: boolean;
};

const maxTotalPatchCharacters = 30_000;
const maxFilePatchCharacters = 6_000;
const recentCommitLimit = 10;

export function createGitClient(baseDir: string) {
  return simpleGit({ baseDir });
}

export async function createGitTools(git: SimpleGit, repositoryRoot: string) {
  setVoltAgentProductionDefault();
  const { createTool } = await import("@voltagent/core");

  return [
    createTool({
      name: "get_repository_status",
      description:
        "Read the repository status before choosing which diff scope to inspect. This is read-only and returns staged, unstaged, and untracked summaries.",
      parameters: z.object({}),
      execute: async () => {
        const [status, branchSummary] = await Promise.all([git.status(), git.branch().catch(() => undefined)]);

        return {
          branch: branchSummary?.current ?? status.current ?? "",
          repositoryRoot,
          stagedCount: status.staged.length,
          statusSummary: formatStatusSummary(status),
          unstagedCount: status.modified.length + status.deleted.length + status.not_added.length + status.conflicted.length,
          untrackedCount: status.not_added.length
        };
      }
    }),
    createTool({
      name: "get_workspace_diff",
      description:
        "Read a bounded structured git diff for the requested scope. The scope must be chosen from the commit instructions, not from this tool.",
      parameters: z.object({
        scope: z.enum(diffScopes).describe("Which workspace changes to inspect: staged, unstaged, or all.")
      }),
      execute: async ({ scope }) => createWorkspaceDiffPayload(git, scope)
    }),
    createTool({
      name: "get_recent_commit_messages",
      description: "Read recent commit subject lines only, for learning format, language, type, scope, and tone. Do not copy unrelated content.",
      parameters: z.object({
        limit: z.number().int().min(1).max(recentCommitLimit).default(recentCommitLimit)
      }),
      execute: async ({ limit }) => {
        const log = await git.log({ maxCount: limit });
        return {
          messages: log.all.map((commit) => commit.message).filter((message) => message.trim().length > 0)
        };
      }
    })
  ];
}

function setVoltAgentProductionDefault() {
  process.env.NODE_ENV ??= "production";
}

export async function createWorkspaceDiffPayload(git: SimpleGit, scope: DiffScope): Promise<WorkspaceDiffPayload> {
  const [status, diffParts] = await Promise.all([git.status(), collectDiffParts(git, scope)]);
  const numstat = parseNumstat(diffParts.map((part) => part.numstat).join("\n"));
  const patches = splitUnifiedDiffByFile(diffParts.map((part) => part.patch).join("\n"));
  const files = collectDiffFiles(status, scope, numstat, patches);
  let remainingPatchCharacters = maxTotalPatchCharacters;
  let truncated = false;

  const boundedFiles = files.map((file) => {
    const omission = getOmittedReason(file.path, file.patch);

    if (omission !== undefined) {
      truncated = truncated || omission === "too_large";
      return { ...file, omittedReason: omission, patch: undefined };
    }

    if (file.patch === undefined) {
      return file;
    }

    if (remainingPatchCharacters <= 0) {
      truncated = true;
      return { ...file, omittedReason: "too_large" as const, patch: undefined };
    }

    const nextPatch = file.patch.slice(0, Math.min(file.patch.length, maxFilePatchCharacters, remainingPatchCharacters));
    remainingPatchCharacters -= nextPatch.length;

    if (nextPatch.length < file.patch.length) {
      truncated = true;
      return { ...file, omittedReason: "too_large" as const, patch: nextPatch };
    }

    return { ...file, patch: nextPatch };
  });

  return {
    files: boundedFiles,
    scope,
    statusSummary: formatStatusSummary(status),
    truncated
  };
}

export function hasWorkspaceChanges(status: StatusResult) {
  return (
    status.staged.length > 0 ||
    status.modified.length > 0 ||
    status.deleted.length > 0 ||
    status.not_added.length > 0 ||
    status.conflicted.length > 0 ||
    status.renamed.length > 0 ||
    status.created.length > 0
  );
}

async function collectDiffParts(git: SimpleGit, scope: DiffScope) {
  const parts: Array<{ numstat: string; patch: string }> = [];

  if (scope === "staged" || scope === "all") {
    parts.push({
      numstat: await git.diff(["--cached", "--numstat"]),
      patch: await git.diff(["--cached"])
    });
  }

  if (scope === "unstaged" || scope === "all") {
    parts.push({
      numstat: await git.diff(["--numstat"]),
      patch: await git.diff()
    });
  }

  return parts;
}

function collectDiffFiles(
  status: StatusResult,
  scope: DiffScope,
  numstat: Map<string, { additions?: number; deletions?: number }>,
  patches: Map<string, string>
): WorkspaceDiffFile[] {
  const files = new Map<string, WorkspaceDiffFile>();

  const addFile = (path: string, statusText: string) => {
    const stats = numstat.get(path);
    const patch = patches.get(path);
    files.set(`${statusText}:${path}`, {
      additions: stats?.additions,
      deletions: stats?.deletions,
      path,
      patch,
      status: statusText
    });
  };

  if (scope === "staged" || scope === "all") {
    status.staged.forEach((path) => addFile(path, "staged"));
    status.created.forEach((path) => addFile(path, "staged"));
    status.renamed.forEach((renamed) => addFile(renamed.to, "renamed"));
  }

  if (scope === "unstaged" || scope === "all") {
    status.modified.forEach((path) => addFile(path, "modified"));
    status.deleted.forEach((path) => addFile(path, "deleted"));
    status.conflicted.forEach((path) => addFile(path, "conflicted"));
    status.not_added.forEach((path) => addFile(path, "untracked"));
  }

  for (const [path, patch] of patches.entries()) {
    if (![...files.values()].some((file) => file.path === path && file.patch === patch)) {
      addFile(path, "modified");
    }
  }

  return [...files.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function parseNumstat(rawNumstat: string) {
  const stats = new Map<string, { additions?: number; deletions?: number }>();

  rawNumstat
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [additions, deletions, path] = line.split("\t");
      stats.set(path, {
        additions: additions === "-" ? undefined : Number(additions),
        deletions: deletions === "-" ? undefined : Number(deletions)
      });
    });

  return stats;
}

function splitUnifiedDiffByFile(rawDiff: string) {
  const patches = new Map<string, string>();
  const chunks = rawDiff.split(/^diff --git /m).filter((chunk) => chunk.trim().length > 0);

  chunks.forEach((chunk) => {
    const patch = `diff --git ${chunk}`.trim();
    const firstLine = patch.split("\n")[0] ?? "";
    const match = /^diff --git a\/(.+?) b\/(.+)$/.exec(firstLine);

    if (match === null) {
      return;
    }

    patches.set(match[2], patch);
  });

  return patches;
}

function getOmittedReason(path: string, patch?: string): WorkspaceDiffFile["omittedReason"] | undefined {
  if (isGeneratedOrMinified(path)) {
    return "generated";
  }

  if (isLockfile(path)) {
    return "lockfile";
  }

  if (patch?.includes("Binary files") === true) {
    return "binary";
  }

  if ((patch?.length ?? 0) > maxFilePatchCharacters) {
    return "too_large";
  }

  return undefined;
}

function isGeneratedOrMinified(path: string) {
  return /(^|\/)(dist|out|build)\//.test(path) || /\.min\.(js|css)$/.test(path) || path.endsWith(".map");
}

function isLockfile(path: string) {
  return /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb)$/.test(path);
}

function formatStatusSummary(status: StatusResult) {
  const parts = [
    `staged: ${status.staged.length}`,
    `modified: ${status.modified.length}`,
    `deleted: ${status.deleted.length}`,
    `untracked: ${status.not_added.length}`,
    `renamed: ${status.renamed.length}`,
    `conflicted: ${status.conflicted.length}`
  ];

  return parts.join(", ");
}
