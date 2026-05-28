export interface AttachmentRecord {
  id: string;
  orgId: string;
  ownerType: "ticket" | "field_task" | "solution" | "installation_project" | "knowledge_article" | "procedure";
  ownerId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  storageProvider: string;
  storageKey: string;
  status: "uploaded" | "processing" | "ready" | "failed" | "deleted";
  rowVersion?: number;
}

export interface AttachmentRepository {
  create(input: Omit<AttachmentRecord, "id">): Promise<AttachmentRecord>;
  findById(orgId: string, attachmentId: string): Promise<AttachmentRecord | null>;
  updateStatus(input: {
    orgId: string;
    attachmentId: string;
    toStatus: AttachmentRecord["status"];
  }): Promise<AttachmentRecord | null>;
  softDelete(input: { orgId: string; attachmentId: string; deletedByUserId: string }): Promise<void>;
}