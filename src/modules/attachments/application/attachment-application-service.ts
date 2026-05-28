import { registerAttachmentRequestSchema } from "@/modules/attachments/contracts/attachment.contracts";
import type { AttachmentRepository } from "@/modules/attachments/application/attachment-repository";

export interface AttachmentDomainEventPublisher {
  publishAttachmentUploaded(input: {
    orgId: string;
    attachmentId: string;
    ownerType: "ticket" | "field_task" | "solution" | "installation_project" | "knowledge_article" | "procedure";
    ownerId: string;
    storageProvider: string;
    storageKey: string;
    sizeBytes: number;
  }): Promise<void>;
}

export class AttachmentApplicationService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly eventPublisher: AttachmentDomainEventPublisher,
  ) {}

  async registerAttachment(input: {
    orgId: string;
    body: {
      ownerType: "ticket" | "field_task" | "solution" | "installation_project" | "knowledge_article" | "procedure";
      ownerId: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      checksumSha256: string;
      storageProvider: string;
      storageKey: string;
      metadata?: Record<string, unknown>;
    };
  }) {
    const parsed = registerAttachmentRequestSchema.parse({ body: input.body });

    const created = await this.attachmentRepository.create({
      orgId: input.orgId,
      ownerType: parsed.body.ownerType,
      ownerId: parsed.body.ownerId,
      fileName: parsed.body.fileName,
      mimeType: parsed.body.mimeType,
      sizeBytes: parsed.body.sizeBytes,
      checksumSha256: parsed.body.checksumSha256,
      storageProvider: parsed.body.storageProvider,
      storageKey: parsed.body.storageKey,
      status: "uploaded",
    });

    await this.eventPublisher.publishAttachmentUploaded({
      orgId: input.orgId,
      attachmentId: created.id,
      ownerType: created.ownerType,
      ownerId: created.ownerId,
      storageProvider: created.storageProvider,
      storageKey: created.storageKey,
      sizeBytes: created.sizeBytes,
    });

    return {
      attachmentId: created.id,
      status: created.status,
      ownerType: created.ownerType,
      ownerId: created.ownerId,
    };
  }
}