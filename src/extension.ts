import * as vscode from "vscode";
import { createGenerateCommitMessageCommand } from "./commit/commitMessageCommand";
import { createApiKeyStore } from "./settings/apiKeyStore";
import { SimpleAmitWebviewPanel } from "./webviewPanel";

export function activate(context: vscode.ExtensionContext) {
  const apiKeyStore = createApiKeyStore(context.secrets);
  const webviewPanel = new SimpleAmitWebviewPanel(context, apiKeyStore);

  context.subscriptions.push(
    vscode.commands.registerCommand("simple-amit.openSettings", () => webviewPanel.show()),
    vscode.commands.registerCommand("simple-amit.generateCommitMessage", createGenerateCommitMessageCommand(apiKeyStore))
  );
}

export function deactivate() {}
