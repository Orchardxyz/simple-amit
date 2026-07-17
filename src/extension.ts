import * as vscode from "vscode";
import { createApiKeyStore } from "./settings/apiKeyStore";
import { getCommitSettings } from "./settings/commitSettingsRepository";
import { SimpleAmitWebviewPanel } from "./webviewPanel";

export function activate(context: vscode.ExtensionContext) {
  const apiKeyStore = createApiKeyStore(context.secrets);
  const webviewPanel = new SimpleAmitWebviewPanel(context, apiKeyStore);

  context.subscriptions.push(
    vscode.commands.registerCommand("simple-amit.openSettings", () => webviewPanel.show()),
    vscode.commands.registerCommand("simple-amit.setApiKey", async () => {
      const apiKey = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        password: true,
        placeHolder: "API key",
        prompt: "Enter the API key for the current Simple Amit provider."
      });

      if (apiKey === undefined) {
        return;
      }

      if (apiKey.trim().length === 0) {
        await vscode.window.showWarningMessage("API key was not saved because it is empty.");
        return;
      }

      await apiKeyStore.saveApiKey(getCommitSettings(), apiKey);
      await vscode.window.showInformationMessage("Simple Amit API key saved.");
    }),
    vscode.commands.registerCommand("simple-amit.clearApiKey", async () => {
      await apiKeyStore.deleteApiKey(getCommitSettings());
      await vscode.window.showInformationMessage("Simple Amit API key cleared.");
    }),
    vscode.commands.registerCommand("simple-amit.generateCommitMessage", () => {
      vscode.window.showInformationMessage("Commit-message generation is coming soon.");
    })
  );
}

export function deactivate() {}
