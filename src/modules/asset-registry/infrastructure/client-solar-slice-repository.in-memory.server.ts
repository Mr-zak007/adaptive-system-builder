import type { ClientSolarSliceRepository } from "@/modules/asset-registry/application/client-solar-slice-repository";
import { operationsStore } from "@/shared/infrastructure/in-memory/operations-store.server";

export class InMemoryClientSolarSliceRepository implements ClientSolarSliceRepository {
  async createClient(input: {
    orgId: string;
    name: string;
    email: string;
    phone: string;
  }) {
    const id = operationsStore.nextId();
    operationsStore.clientProfiles.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id };
  }

  async createSystem(input: {
    orgId: string;
    clientId: string;
    systemName: string;
    location: string;
  }) {
    const id = operationsStore.nextId();
    operationsStore.solarSystems.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id };
  }

  async createComponent(input: {
    orgId: string;
    systemId: string;
    componentType: string;
    serialNumber: string;
    status: "active" | "maintenance" | "retired";
  }) {
    const id = operationsStore.nextId();
    operationsStore.solarComponents.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id };
  }

  async createHistoryEvent(input: {
    orgId: string;
    systemId: string;
    eventType: string;
    note: string;
  }) {
    const id = operationsStore.nextId();
    operationsStore.solarHistory.push({ ...input, id, occurredAt: operationsStore.nowIso() });
    return { id };
  }
}