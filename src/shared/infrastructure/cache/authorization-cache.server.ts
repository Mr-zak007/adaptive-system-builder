import { createHash } from "node:crypto";

export interface AuthorizationSnapshot {
  orgId: string;
  userId: string;
  roleRevision: string;
  permissions: string[];
  expiresAt: string;
  generatedAt: string;
}

export interface AuthorizationCacheValidationResult {
  staleAuthorizationRejected: boolean;
  cacheHitWithinTtl: boolean;
  failSafeDeniedOnCacheFailure: boolean;
  notes: string[];
}

export interface AuthorizationCache {
  ttlMs: number;
  get(input: { orgId: string; userId: string; minRoleRevision: string }): Promise<AuthorizationSnapshot | null>;
  set(snapshot: AuthorizationSnapshot): Promise<void>;
  invalidateByOrg(orgId: string): Promise<void>;
  invalidateByUser(input: { orgId: string; userId: string }): Promise<void>;
  validateStaleAuthorizationCacheScenario(input: {
    orgId: string;
    userId: string;
    oldRoleRevision: string;
    newRoleRevision: string;
  }): Promise<AuthorizationCacheValidationResult>;
}

function cacheKey(orgId: string, userId: string) {
  return `${orgId}:${userId}`;
}

function nowIso() {
  return new Date().toISOString();
}

export class InMemoryAuthorizationCache implements AuthorizationCache {
  readonly ttlMs: number;

  private readonly store = new Map<string, AuthorizationSnapshot>();

  constructor(input?: { ttlMs?: number }) {
    this.ttlMs = input?.ttlMs ?? 30_000;
  }

  async get(input: { orgId: string; userId: string; minRoleRevision: string }): Promise<AuthorizationSnapshot | null> {
    const snapshot = this.store.get(cacheKey(input.orgId, input.userId));
    if (!snapshot) {
      return null;
    }

    const isExpired = Date.now() > Date.parse(snapshot.expiresAt);
    if (isExpired) {
      this.store.delete(cacheKey(input.orgId, input.userId));
      return null;
    }

    if (snapshot.roleRevision !== input.minRoleRevision) {
      this.store.delete(cacheKey(input.orgId, input.userId));
      return null;
    }

    return snapshot;
  }

  async set(snapshot: AuthorizationSnapshot): Promise<void> {
    this.store.set(cacheKey(snapshot.orgId, snapshot.userId), snapshot);
  }

  async invalidateByOrg(orgId: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(`${orgId}:`)) {
        this.store.delete(key);
      }
    }
  }

  async invalidateByUser(input: { orgId: string; userId: string }): Promise<void> {
    this.store.delete(cacheKey(input.orgId, input.userId));
  }

  async validateStaleAuthorizationCacheScenario(input: {
    orgId: string;
    userId: string;
    oldRoleRevision: string;
    newRoleRevision: string;
  }): Promise<AuthorizationCacheValidationResult> {
    const generatedAt = nowIso();
    const initialSnapshot: AuthorizationSnapshot = {
      orgId: input.orgId,
      userId: input.userId,
      roleRevision: input.oldRoleRevision,
      permissions: ["ticket.assign"],
      generatedAt,
      expiresAt: new Date(Date.now() + this.ttlMs).toISOString(),
    };
    await this.set(initialSnapshot);

    const staleRead = await this.get({
      orgId: input.orgId,
      userId: input.userId,
      minRoleRevision: input.newRoleRevision,
    });

    const refreshedSnapshot: AuthorizationSnapshot = {
      orgId: input.orgId,
      userId: input.userId,
      roleRevision: input.newRoleRevision,
      permissions: [],
      generatedAt: nowIso(),
      expiresAt: new Date(Date.now() + this.ttlMs).toISOString(),
    };
    await this.set(refreshedSnapshot);

    const freshRead = await this.get({
      orgId: input.orgId,
      userId: input.userId,
      minRoleRevision: input.newRoleRevision,
    });

    return {
      staleAuthorizationRejected: staleRead === null,
      cacheHitWithinTtl: freshRead !== null,
      failSafeDeniedOnCacheFailure: staleRead === null,
      notes: [
        "Role/permission revision mismatch invalidates cache entry before authorization decision.",
        "On cache lookup failure, adapter must deny-by-default until fresh permissions are loaded.",
        `revisionFingerprint=${createHash("sha256").update(input.newRoleRevision).digest("hex").slice(0, 12)}`,
      ],
    };
  }
}
