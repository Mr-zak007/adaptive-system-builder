import { createHash, randomUUID } from "node:crypto";

export interface StorageObjectMetadata {
  orgId: string;
  key: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  createdAt: string;
  expiresAt?: string;
}

export interface CreateSignedUploadUrlInput {
  orgId: string;
  ownerType: "ticket" | "field_task" | "solution" | "installation_project" | "knowledge_article" | "procedure";
  ownerId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
}

export interface SignedUrlPayload {
  url: string;
  method: "PUT";
  expiresAt: string;
  requiredHeaders: Record<string, string>;
  storageKey: string;
}

export interface StorageProviderAdapter {
  readonly providerName: string;
  createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<SignedUrlPayload>;
  markUploaded(input: { orgId: string; storageKey: string; checksumSha256: string; sizeBytes: number }): Promise<void>;
  deleteObject(input: { orgId: string; storageKey: string }): Promise<void>;
  cleanupExpiredOrphans(input: { orgId: string; olderThanIso: string; limit: number }): Promise<number>;
  runRetentionSweep(input: { orgId: string; retainUntilIso: string; limit: number }): Promise<number>;
  reconcileOrphans(input: {
    orgId: string;
    existingAttachmentKeys: string[];
    maxDelete: number;
  }): Promise<{ deletedKeys: string[]; notes: string[] }>;
}

function assertChecksum(value: string) {
  if (!/^[A-Fa-f0-9]{64}$/.test(value)) {
    throw new Error("STORAGE_CHECKSUM_INVALID");
  }
}

function assertContentType(value: string) {
  const allowed = /^(image\/(jpeg|png|webp)|application\/pdf)$/i;
  if (!allowed.test(value)) {
    throw new Error("STORAGE_CONTENT_TYPE_REJECTED");
  }
}

export class InMemoryStorageProviderAdapter implements StorageProviderAdapter {
  readonly providerName = "in_memory_storage";

  private readonly objects = new Map<string, StorageObjectMetadata>();

  async createSignedUploadUrl(input: CreateSignedUploadUrlInput): Promise<SignedUrlPayload> {
    assertChecksum(input.checksumSha256);
    assertContentType(input.contentType);

    if (input.sizeBytes <= 0 || input.sizeBytes > 20 * 1024 * 1024) {
      throw new Error("STORAGE_SIZE_INVALID");
    }

    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `org/${input.orgId}/${input.ownerType}/${input.ownerId}/${randomUUID()}-${safeFileName}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    this.objects.set(storageKey, {
      orgId: input.orgId,
      key: storageKey,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      checksumSha256: input.checksumSha256,
      createdAt: new Date().toISOString(),
      expiresAt,
    });

    return {
      url: `https://storage.local/upload/${encodeURIComponent(storageKey)}`,
      method: "PUT",
      expiresAt,
      requiredHeaders: {
        "content-type": input.contentType,
        "x-checksum-sha256": input.checksumSha256,
      },
      storageKey,
    };
  }

  async markUploaded(input: { orgId: string; storageKey: string; checksumSha256: string; sizeBytes: number }): Promise<void> {
    assertChecksum(input.checksumSha256);
    const existing = this.objects.get(input.storageKey);
    if (!existing || existing.orgId !== input.orgId) {
      throw new Error("STORAGE_OBJECT_NOT_FOUND");
    }

    if (existing.sizeBytes !== input.sizeBytes || existing.checksumSha256 !== input.checksumSha256) {
      throw new Error("STORAGE_OBJECT_INTEGRITY_MISMATCH");
    }
  }

  async deleteObject(input: { orgId: string; storageKey: string }): Promise<void> {
    const existing = this.objects.get(input.storageKey);
    if (!existing) {
      return;
    }

    if (existing.orgId !== input.orgId) {
      throw new Error("STORAGE_CROSS_TENANT_DELETE_BLOCKED");
    }

    this.objects.delete(input.storageKey);
  }

  async cleanupExpiredOrphans(input: { orgId: string; olderThanIso: string; limit: number }): Promise<number> {
    let cleaned = 0;
    for (const [key, object] of this.objects.entries()) {
      if (cleaned >= input.limit) {
        break;
      }

      if (object.orgId !== input.orgId) {
        continue;
      }

      const isExpired = object.expiresAt ? Date.parse(object.expiresAt) < Date.now() : false;
      const isOlder = Date.parse(object.createdAt) < Date.parse(input.olderThanIso);
      if (isExpired || isOlder) {
        this.objects.delete(key);
        cleaned += 1;
      }
    }
    return cleaned;
  }

  async runRetentionSweep(input: { orgId: string; retainUntilIso: string; limit: number }): Promise<number> {
    let removed = 0;
    for (const [key, object] of this.objects.entries()) {
      if (removed >= input.limit) {
        break;
      }
      if (object.orgId !== input.orgId) {
        continue;
      }
      if (Date.parse(object.createdAt) < Date.parse(input.retainUntilIso)) {
        this.objects.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  async reconcileOrphans(input: {
    orgId: string;
    existingAttachmentKeys: string[];
    maxDelete: number;
  }): Promise<{ deletedKeys: string[]; notes: string[] }> {
    const attachmentSet = new Set(input.existingAttachmentKeys);
    const deletedKeys: string[] = [];

    for (const [key, object] of this.objects.entries()) {
      if (deletedKeys.length >= input.maxDelete) {
        break;
      }
      if (object.orgId !== input.orgId) {
        continue;
      }
      if (!attachmentSet.has(key)) {
        this.objects.delete(key);
        deletedKeys.push(key);
      }
    }

    return {
      deletedKeys,
      notes: [
        "Reconciliation deletes only objects absent from attachment metadata set.",
        `orphanDigest=${createHash("sha256").update(deletedKeys.join("|")).digest("hex").slice(0, 12)}`,
      ],
    };
  }
}
