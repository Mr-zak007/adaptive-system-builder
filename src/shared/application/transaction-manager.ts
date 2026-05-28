export interface TransactionContext {
  readonly requestId: string;
  readonly correlationId?: string;
}

export interface TransactionManager {
  runInTransaction<T>(
    operationName: string,
    run: (tx: TransactionContext) => Promise<T>,
  ): Promise<T>;
}