export interface ProductCatalogSliceRepository {
  createBrand(input: { orgId: string; name: string }): Promise<{ id: string }>;
  createModel(input: {
    orgId: string;
    brandId: string;
    name: string;
    specifications: Record<string, string>;
    componentModelIds: string[];
  }): Promise<{ id: string; specificationsCount: number; componentRelationshipCount: number }>;
}