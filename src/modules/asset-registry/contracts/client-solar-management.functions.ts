import { createServerFn } from "@tanstack/react-start";
import {
  clientSolarSliceRequestSchema,
  clientSolarSliceResponseSchema,
} from "@/modules/asset-registry/contracts/client-solar-management.contracts";
import { ClientSolarSliceService } from "@/modules/asset-registry/application/client-solar-slice-service";
import { InMemoryClientSolarSliceRepository } from "@/modules/asset-registry/infrastructure/client-solar-slice-repository.in-memory.server";

export const runClientSolarSlice = createServerFn({ method: "POST" })
  .inputValidator((data) => clientSolarSliceRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const service = new ClientSolarSliceService(new InMemoryClientSolarSliceRepository());
    const response = await service.runSlice(data);
    return clientSolarSliceResponseSchema.parse(response);
  });