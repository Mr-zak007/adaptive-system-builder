import type { ProductCatalogSliceRepository } from "@/modules/catalog/application/product-catalog-slice-repository";
import { operationsStore } from "@/shared/infrastructure/in-memory/operations-store.server";

export class InMemoryProductCatalogSliceRepository implements ProductCatalogSliceRepository {
  async createBrand(input: { orgId: string; name: string }) {
    const id = operationsStore.nextId();
    operationsStore.productBrands.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id };
  }

  async createModel(input: {
    orgId: string;
    brandId: string;
    name: string;
    specifications: Record<string, string>;
    componentModelIds: string[];
  }) {
    const id = operationsStore.nextId();
    operationsStore.productModels.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return {
      id,
      specificationsCount: Object.keys(input.specifications).length,
      componentRelationshipCount: input.componentModelIds.length,
    };
  }
}