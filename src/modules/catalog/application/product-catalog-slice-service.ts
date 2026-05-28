import type { ProductCatalogSliceRepository } from "@/modules/catalog/application/product-catalog-slice-repository";
import {
  productCatalogSliceRequestSchema,
  type ProductCatalogSliceResponseDto,
} from "@/modules/catalog/contracts/product-catalog.contracts";
import { assertBrandName, assertModelSpecs } from "@/modules/catalog/domain/catalog-invariants";

export class ProductCatalogSliceService {
  constructor(private readonly repository: ProductCatalogSliceRepository) {}

  async runSlice(input: unknown): Promise<ProductCatalogSliceResponseDto> {
    const parsed = productCatalogSliceRequestSchema.parse(input);
    assertBrandName(parsed.brand.name);
    assertModelSpecs(parsed.model.specifications);

    const brand = await this.repository.createBrand({
      orgId: parsed.orgId,
      name: parsed.brand.name,
    });

    const model = await this.repository.createModel({
      orgId: parsed.orgId,
      brandId: brand.id,
      name: parsed.model.name,
      specifications: parsed.model.specifications,
      componentModelIds: parsed.model.componentModelIds,
    });

    return {
      brandId: brand.id,
      modelId: model.id,
      specificationsCount: model.specificationsCount,
      componentRelationshipCount: model.componentRelationshipCount,
    };
  }
}