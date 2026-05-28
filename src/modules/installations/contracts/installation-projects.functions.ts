import { createServerFn } from "@tanstack/react-start";
import {
  installationSliceRequestSchema,
  installationSliceResponseSchema,
} from "@/modules/installations/contracts/installation-projects.contracts";
import { InstallationSliceService } from "@/modules/installations/application/installation-slice-service";
import { InMemoryInstallationSliceRepository } from "@/modules/installations/infrastructure/installation-slice-repository.in-memory.server";

export const runInstallationProjectsSlice = createServerFn({ method: "POST" })
  .inputValidator((data) => installationSliceRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const service = new InstallationSliceService(new InMemoryInstallationSliceRepository());
    const response = await service.runSlice(data);
    return installationSliceResponseSchema.parse(response);
  });