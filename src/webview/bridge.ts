import {
  type BridgeErrorCode,
  type BridgeRequest,
  type BridgeRequestArgs,
  type BridgeRequestParams,
  type BridgeRequestResult,
  isBridgeResponse,
  type BridgeMethod as BridgeMethodType
} from "../shared/webviewProtocol";

type VsCodeApi = {
  postMessage(message: BridgeRequest): void;
};

type PendingRequest = {
  reject: (reason: Error) => void;
  resolve: (result: unknown) => void;
  timeout: number;
};

declare function acquireVsCodeApi(): VsCodeApi;

export class BridgeRequestError extends Error {
  constructor(
    readonly code: BridgeErrorCode,
    message: string
  ) {
    super(message);
    this.name = "BridgeRequestError";
  }
}

export class WebviewBridge {
  private readonly api = acquireVsCodeApi();
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private requestNumber = 0;

  constructor(private readonly timeoutMs = 10_000) {
    window.addEventListener("message", this.handleMessage);
  }

  request<Method extends BridgeMethodType>(method: Method, ...[params]: BridgeRequestArgs<Method>): Promise<BridgeRequestResult<Method>> {
    const id = this.createRequestId();
    const request: BridgeRequest<Method> = {
      type: "request",
      id,
      method,
      params: params as BridgeRequestParams<Method>
    };

    return new Promise<BridgeRequestResult<Method>>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`The ${method} request timed out.`));
      }, this.timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (result) => resolve(result as BridgeRequestResult<Method>),
        reject,
        timeout
      });
      this.api.postMessage(request);
    });
  }

  dispose() {
    window.removeEventListener("message", this.handleMessage);

    for (const pendingRequest of this.pendingRequests.values()) {
      window.clearTimeout(pendingRequest.timeout);
      pendingRequest.reject(new Error("The Webview bridge was disposed."));
    }

    this.pendingRequests.clear();
  }

  private readonly handleMessage = (event: MessageEvent<unknown>) => {
    if (!isBridgeResponse(event.data)) {
      return;
    }

    const pendingRequest = this.pendingRequests.get(event.data.id);
    if (pendingRequest === undefined) {
      return;
    }

    this.pendingRequests.delete(event.data.id);
    window.clearTimeout(pendingRequest.timeout);

    if (event.data.ok) {
      pendingRequest.resolve(event.data.result);
      return;
    }

    pendingRequest.reject(new BridgeRequestError(event.data.error.code, event.data.error.message));
  };

  private createRequestId() {
    this.requestNumber += 1;
    return `${Date.now()}-${this.requestNumber}`;
  }
}

export const webviewBridge = new WebviewBridge();
