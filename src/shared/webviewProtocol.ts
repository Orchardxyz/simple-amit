/* eslint-disable import/newline-after-import */
import { isCommitSettings, type CommitSettings } from "./commitSettings";
/* eslint-enable import/newline-after-import */

/**
 * Method identifiers used by the Webview bridge.
 *
 * Keep callers on these constants instead of scattering protocol strings.
 */
export const BridgeMethod = {
  GetInitialState: "settings.getInitialState",
  SaveSettings: "settings.save",
  ResetSettings: "settings.reset"
} as const;

export type BridgeMethod = (typeof BridgeMethod)[keyof typeof BridgeMethod];

export const BridgeErrorCode = {
  InvalidMessage: 1001,
  Internal: 1900
} as const;

export type BridgeErrorCode = (typeof BridgeErrorCode)[keyof typeof BridgeErrorCode];

export type InitialState = {
  settings: CommitSettings;
};

/**
 * The single source of truth for each bridge method's input and output.
 */
export type BridgeContract = {
  [BridgeMethod.GetInitialState]: {
    params: undefined;
    result: InitialState;
  };
  [BridgeMethod.SaveSettings]: {
    params: CommitSettings;
    result: InitialState;
  };
  [BridgeMethod.ResetSettings]: {
    params: undefined;
    result: InitialState;
  };
};

export type BridgeRequestParams<Method extends BridgeMethod> = BridgeContract[Method]["params"];

export type BridgeRequestResult<Method extends BridgeMethod> = BridgeContract[Method]["result"];

export type BridgeRequestArgs<Method extends BridgeMethod> =
  BridgeRequestParams<Method> extends undefined ? [] : [params: BridgeRequestParams<Method>];

export type BridgeRequest<Method extends BridgeMethod = BridgeMethod> = {
  type: "request";
  id: string;
  method: Method;
  params: BridgeRequestParams<Method>;
};

export type BridgeSuccessResponse<Method extends BridgeMethod = BridgeMethod> = {
  type: "response";
  id: string;
  ok: true;
  result: BridgeRequestResult<Method>;
};

export type BridgeFailureResponse = {
  type: "response";
  id: string;
  ok: false;
  error: {
    code: BridgeErrorCode;
    message: string;
  };
};

export type BridgeResponse = BridgeSuccessResponse | BridgeFailureResponse;

export type BridgeHandler<Method extends BridgeMethod> = (
  params: BridgeRequestParams<Method>
) => BridgeRequestResult<Method> | Promise<BridgeRequestResult<Method>>;

export type BridgeHandlers = {
  [Method in BridgeMethod]: BridgeHandler<Method>;
};

export function isBridgeRequest(message: unknown): message is BridgeRequest {
  if (!isRecord(message) || message.type !== "request" || typeof message.id !== "string") {
    return false;
  }

  switch (message.method) {
    case BridgeMethod.GetInitialState:
    case BridgeMethod.ResetSettings:
      return message.params === undefined;
    case BridgeMethod.SaveSettings:
      return isCommitSettings(message.params);
    default:
      return false;
  }
}

export function isBridgeResponse(message: unknown): message is BridgeResponse {
  if (!isRecord(message) || message.type !== "response" || typeof message.id !== "string" || typeof message.ok !== "boolean") {
    return false;
  }

  if (message.ok) {
    return "result" in message;
  }

  return isRecord(message.error) && typeof message.error.message === "string" && isBridgeErrorCode(message.error.code);
}

function isBridgeErrorCode(value: unknown): value is BridgeErrorCode {
  return value === BridgeErrorCode.InvalidMessage || value === BridgeErrorCode.Internal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
