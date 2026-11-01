import * as vscode from "vscode";
import { getCommitSettings } from "../settings/commitSettingsRepository";
import { generateCommitMessageWithAgent, type CommitMessageResult } from "./commitMessageAgent";
import { createGitClient, hasWorkspaceChanges, readGit } from "./gitTools";
import { createCommitLanguageModel } from "./modelFactory";
import type { ApiKeyStore } from "../settings/apiKeyStore";
import type { SimpleGit } from "simple-git";

type GitExtension = {
  getAPI(version: 1): GitApi;
};

type GitApi = {
  repositories: GitRepository[];
};

type GitRepository = {
  inputBox: {
    value: string;
  };
  rootUri: vscode.Uri;
};

export function createGenerateCommitMessageCommand(apiKeyStore: ApiKeyStore) {
  return async () => {
    const settings = getCommitSettings();

    if (settings.model.trim().length === 0) {
      await vscode.window.showWarningMessage("Choose a model before generating a commit message.");
      return;
    }

    const apiKey = await apiKeyStore.getApiKey(settings);

    if (apiKey === undefined) {
      await vscode.window.showWarningMessage("Save an API key for the current Simple Amit provider before generating a commit message.");
      return;
    }

    const repository = await resolveGitRepository();
    const workspaceFolder = repository?.rootUri.fsPath ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (workspaceFolder === undefined) {
      await vscode.window.showWarningMessage("Open a Git repository before generating a commit message.");
      return;
    }

    const controller = new AbortController();
    try {
      const outcome = await vscode.window.withProgress(
        {
          cancellable: true,
          location: vscode.ProgressLocation.Notification,
          title: "Generating commit message with Simple Amit"
        },
        async (_progress, token) => {
          let committed = false;
          const subscription = token.onCancellationRequested(() => {
            if (!committed) {
              controller.abort();
            }
          });

          try {
            if (token.isCancellationRequested) {
              controller.abort();
            }

            controller.signal.throwIfAborted();
            const model = await createCommitLanguageModel(settings, apiKey);
            const git = createGitClient(workspaceFolder);

            return await runCommitMessageGeneration({
              git,
              signal: controller.signal,
              generate: () =>
                generateCommitMessageWithAgent({
                  git,
                  model,
                  repositoryRoot: workspaceFolder,
                  settings,
                  signal: controller.signal
                }),
              writeMessage: (message) => {
                committed = true;
                writeCommitMessage(repository, message);
              }
            });
          } finally {
            subscription.dispose();
          }
        }
      );

      if (controller.signal.aborted) {
        return;
      }

      if (outcome === "no_changes") {
        await vscode.window.showWarningMessage("No Git changes found for Simple Amit to analyze.");
        return;
      }

      await vscode.window.showInformationMessage("Simple Amit generated a commit message.");
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      const selection = await vscode.window.showErrorMessage(
        `Unable to generate a commit message with Simple Amit: ${getErrorMessage(error)}`,
        "Open Settings"
      );

      if (selection === "Open Settings") {
        await vscode.commands.executeCommand("simple-amit.openSettings");
      }
    }
  };
}

type RunCommitMessageGenerationOptions = {
  git: SimpleGit;
  signal: AbortSignal;
  generate: () => Promise<CommitMessageResult>;
  writeMessage: (message: string) => void;
};

export async function runCommitMessageGeneration(options: RunCommitMessageGenerationOptions): Promise<"generated" | "no_changes"> {
  const status = await readGit(options.signal, () => options.git.status());

  if (!hasWorkspaceChanges(status)) {
    return "no_changes";
  }

  const result = await options.generate();
  options.signal.throwIfAborted();
  options.writeMessage(result.message);
  return "generated";
}

async function resolveGitRepository() {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");

  if (extension === undefined) {
    return undefined;
  }

  const gitExtension = extension.isActive ? extension.exports : await extension.activate();
  const api = gitExtension.getAPI(1);

  return api.repositories[0];
}

function writeCommitMessage(repository: GitRepository | undefined, message: string) {
  if (repository !== undefined) {
    repository.inputBox.value = message;
    return;
  }

  vscode.scm.inputBox.value = message;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  return "Unknown error.";
}
