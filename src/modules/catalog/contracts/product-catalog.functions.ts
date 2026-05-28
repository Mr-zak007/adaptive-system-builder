import { createServerFn } from "@tanstack/react-start";
import {
  productCatalogSliceRequestSchema,
  productCatalogSliceResponseSchema,
} from "@/modules/catalog/contracts/product-catalog.contracts";
import { ProductCatalogSliceService } from "@/modules/catalog/application/product-catalog-slice-service";
import { InMemoryProductCatalogSliceRepository } from "@/modules/catalog/infrastructure/product-catalog-slice-repository.in-memory.server";

export const runProductCatalogSlice = createServerFn({ method: "POST" })
  .inputValidator((data) => productCatalogSliceRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const service = new ProductCatalogSliceService(new InMemoryProductCatalogSliceRepository());
    const response = await service.runSlice(data);
    return productCatalogSliceResponseSchema.parse(response);
  });