import { jobExecutionContractSchema, type JobExecutionContract } from "@/modules/jobs-orchestration/contracts/job.contracts";

export interface JobDispatcher {
  enqueue(input: {
    orgId: string;
    jobType: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
    runAt?: string;
  }): Promise<void>;
}

export interface JobService {
  registerContract(contract: JobExecutionContract): void;
  schedule(input: {
    orgId: string;
    jobType: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
    runAt?: string;
  }): Promise<void>;
}

export class ContractBackedJobService implements JobService {
  private readonly contracts = new Map<string, JobExecutionContract>();

  constructor(private readonly dispatcher: JobDispatcher) {}

  registerContract(contract: JobExecutionContract) {
    const parsed = jobExecutionContractSchema.parse(contract);
    this.contracts.set(parsed.jobType, parsed);
  }

  async schedule(input: {
    orgId: string;
    jobType: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
    runAt?: string;
  }) {
    const contract = this.contracts.get(input.jobType);
    if (!contract) {
      throw new Error(`Unknown job contract: ${input.jobType}`);
    }

    await this.dispatcher.enqueue({
      orgId: input.orgId,
      jobType: input.jobType,
      payload: input.payload,
      idempotencyKey: input.idempotencyKey,
      runAt: input.runAt,
    });
  }
}