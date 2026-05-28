import type { ClientSolarSliceRepository } from "@/modules/asset-registry/application/client-solar-slice-repository";
import {
  clientSolarSliceRequestSchema,
  type ClientSolarSliceResponseDto,
} from "@/modules/asset-registry/contracts/client-solar-management.contracts";
import {
  assertClientIdentity,
  assertSolarComponentType,
} from "@/modules/asset-registry/domain/client-system-invariants";

export class ClientSolarSliceService {
  constructor(private readonly repository: ClientSolarSliceRepository) {}

  async runSlice(input: unknown): Promise<ClientSolarSliceResponseDto> {
    const parsed = clientSolarSliceRequestSchema.parse(input);
    assertClientIdentity(parsed.client.name, parsed.client.email);
    assertSolarComponentType(parsed.component.componentType);

    const client = await this.repository.createClient({
      orgId: parsed.orgId,
      name: parsed.client.name,
      email: parsed.client.email,
      phone: parsed.client.phone,
    });

    const system = await this.repository.createSystem({
      orgId: parsed.orgId,
      clientId: client.id,
      systemName: parsed.system.systemName,
      location: parsed.system.location,
    });

    const component = await this.repository.createComponent({
      orgId: parsed.orgId,
      systemId: system.id,
      componentType: parsed.component.componentType,
      serialNumber: parsed.component.serialNumber,
      status: parsed.component.status,
    });

    const history = await this.repository.createHistoryEvent({
      orgId: parsed.orgId,
      systemId: system.id,
      eventType: parsed.historyEvent.eventType,
      note: parsed.historyEvent.note,
    });

    return {
      clientId: client.id,
      systemId: system.id,
      componentId: component.id,
      historyEventId: history.id,
    };
  }
}