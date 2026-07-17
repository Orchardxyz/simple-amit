import * as vscode from "vscode";
import { getCommitSettings } from "../settings/commitSettingsRepository";
import { generateCommitMessageWithAgent } from "./commitMessageAgent";
import { createGitClient, hasWorkspaceChanges } from "./gitTools";
import { createCommitLanguageModel } from "./modelFactory";
import type { ApiKeyStore } from "../settings/apiKeyStore";

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

    const git = createGitClient(workspaceFolder);
    const status = await git.status();

    if (!hasWorkspaceChanges(status)) {
      await vscode.window.showWarningMessage("No Git changes found for Simple Amit to analyze.");
      return;
    }

    try {
      const result = await vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Notification,
          title: "Generating commit message with Simple Amit"
        },
        async () =>
          generateCommitMessageWithAgent({
            git,
            model: await createCommitLanguageModel(settings, apiKey),
            repositoryRoot: workspaceFolder,
            settings
          })
      );

      writeCommitMessage(repository, result.message);
      await vscode.window.showInformationMessage("Simple Amit generated a commit message.");
    } catch (error) {
      await vscode.window.showErrorMessage(`Unable to generate a commit message with Simple Amit: ${getErrorMessage(error)}`);
    }
  };
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
