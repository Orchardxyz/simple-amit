import * as vscode from "vscode";
import { getCommitSettings, resetCommitSettings, saveCommitSettings } from "./settings/commitSettingsRepository";
import { BridgeMethod, type BridgeHandlers } from "./shared/webviewProtocol";
import { WebviewHostBridge } from "./webviewHostBridge";

export class SimpleAmitWebviewPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  show() {
    if (this.panel !== undefined) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel("simpleAmitSettings", "Simple Amit", vscode.ViewColumn.One, {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview")]
    });
    this.panel.iconPath = vscode.Uri.joinPath(this.context.extensionUri, "resources", "brand", "simple-amit-mark.svg");

    this.panel.webview.html = this.renderHtml(this.panel.webview);
    const bridge = new WebviewHostBridge(this.panel.webview, this.createBridgeHandlers());
    this.panel.onDidDispose(() => {
      bridge.dispose();
      this.panel = undefined;
    });
  }

  private createBridgeHandlers(): BridgeHandlers {
    return {
      [BridgeMethod.GetInitialState]: () => ({
        settings: getCommitSettings()
      }),
      [BridgeMethod.SaveSettings]: async (settings) => ({
        settings: await saveCommitSettings(settings)
      }),
      [BridgeMethod.ResetSettings]: async () => ({
        settings: await resetCommitSettings()
      })
    };
  }

  private renderHtml(webview: vscode.Webview) {
    const nonce = getNonce();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview", "webview.js"));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview", "webview.css"));

    return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};">
		<link rel="stylesheet" href="${styleUri.toString()}">
		<title>Simple Amit Settings</title>
	</head>
	<body>
		<div id="app"></div>
		<script nonce="${nonce}" type="module" src="${scriptUri.toString()}"></script>
	</body>
</html>`;
  }
}

function getNonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let nonce = "";
  for (let index = 0; index < 32; index += 1) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
