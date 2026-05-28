export interface IdempotencyReplay {
  kind: "replay";
  response: unknown;
}

export interface IdempotencyStarted {
  kind: "started";
}

export interface IdempotencyConflict {
  kind: "conflict";
}

export type IdempotencyStartResult = IdempotencyReplay | IdempotencyStarted | IdempotencyConflict;

export interface IdempotencyStore {
  begin(input: {
    orgId: string;
    operationType: string;
    idempotencyKey: string;
    requestHash: string;
    expiresAt?: string;
  }): Promise<IdempotencyStartResult>;

  complete(input: {
    orgId: string;
    operationType: string;
    idempotencyKey: string;
    response: unknown;
  }): Promise<void>;
}