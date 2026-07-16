import {
  type BridgeErrorCode,
  BridgeErrorCode as BridgeErrorCodes,
  type BridgeHandlers,
  type BridgeRequest,
  type BridgeRequestResult,
  isBridgeRequest
} from "./shared/webviewProtocol";
import type * as vscode from "vscode";

export class WebviewHostBridge implements vscode.Disposable {
  private readonly messageListener: vscode.Disposable;

  constructor(
    private readonly webview: vscode.Webview,
    private readonly handlers: BridgeHandlers
  ) {
    this.messageListener = webview.onDidReceiveMessage((message) => {
      this.handleMessage(message).catch(() => undefined);
    });
  }

  dispose() {
    this.messageListener.dispose();
  }

  private async handleMessage(message: unknown) {
    if (!isBridgeRequest(message)) {
      return;
    }

    try {
      const result = await this.dispatch(message);
      await this.webview.postMessage({
        type: "response",
        id: message.id,
        ok: true,
        result
      });
    } catch {
      await this.sendFailure(message.id, BridgeErrorCodes.Internal, "Unable to complete the request.");
    }
  }

  private async dispatch<Method extends BridgeRequest["method"]>(request: BridgeRequest<Method>) {
    const handler = this.handlers[request.method] as (
      params: BridgeRequest<Method>["params"]
    ) => BridgeRequestResult<Method> | Promise<BridgeRequestResult<Method>>;

    return handler(request.params);
  }

  private async sendFailure(id: string, code: BridgeErrorCode, message: string) {
    await this.webview.postMessage({
      type: "response",
      id,
      ok: false,
      error: { code, message }
    });
  }
}
