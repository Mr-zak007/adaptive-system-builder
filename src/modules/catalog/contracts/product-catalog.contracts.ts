import { z } from "zod";

export const productBrandInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const productModelInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  specifications: z.record(z.string(), z.string().trim().min(1).max(500)).refine((v) => Object.keys(v).length > 0),
  componentModelIds: z.array(z.string().uuid()).max(30),
});

export const productCatalogSliceRequestSchema = z.object({
  orgId: z.string().uuid(),
  brand: productBrandInputSchema,
  model: productModelInputSchema,
});

export const productCatalogSliceResponseSchema = z.object({
  brandId: z.string().uuid(),
  modelId: z.string().uuid(),
  specificationsCount: z.number().int().positive(),
  componentRelationshipCount: z.number().int().nonnegative(),
});

export type ProductCatalogSliceRequestDto = z.infer<typeof productCatalogSliceRequestSchema>;
export type ProductCatalogSliceResponseDto = z.infer<typeof productCatalogSliceResponseSchema>;