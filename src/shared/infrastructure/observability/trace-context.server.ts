import { randomUUID } from "node:crypto";

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  correlationId: string;
  asyncHop: number;
}

export function createRootTraceContext(input?: { correlationId?: string }): TraceContext {
  return {
    traceId: randomUUID(),
    spanId: randomUUID(),
    correlationId: input?.correlationId ?? randomUUID(),
    asyncHop: 0,
  };
}

export function createChildAsyncTrace(parent: TraceContext): TraceContext {
  return {
    traceId: parent.traceId,
    parentSpanId: parent.spanId,
    spanId: randomUUID(),
    correlationId: parent.correlationId,
    asyncHop: parent.asyncHop + 1,
  };
}
