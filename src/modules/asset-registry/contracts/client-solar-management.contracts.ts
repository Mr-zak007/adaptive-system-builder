import { z } from "zod";

export const clientProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(30),
});

export const solarSystemProfileInputSchema = z.object({
  systemName: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(300),
});

export const solarComponentInputSchema = z.object({
  componentType: z.string().trim().min(2).max(100),
  serialNumber: z.string().trim().min(2).max(120),
  status: z.enum(["active", "maintenance", "retired"]),
});

export const solarHistoryInputSchema = z.object({
  eventType: z.string().trim().min(2).max(100),
  note: z.string().trim().min(2).max(1000),
});

export const clientSolarSliceRequestSchema = z.object({
  orgId: z.string().uuid(),
  client: clientProfileInputSchema,
  system: solarSystemProfileInputSchema,
  component: solarComponentInputSchema,
  historyEvent: solarHistoryInputSchema,
});

export const clientSolarSliceResponseSchema = z.object({
  clientId: z.string().uuid(),
  systemId: z.string().uuid(),
  componentId: z.string().uuid(),
  historyEventId: z.string().uuid(),
});

export type ClientSolarSliceRequestDto = z.infer<typeof clientSolarSliceRequestSchema>;
export type ClientSolarSliceResponseDto = z.infer<typeof clientSolarSliceResponseSchema>;