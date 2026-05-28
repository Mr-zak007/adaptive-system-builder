import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncStateBanner } from "@/components/system/async-state";
import { runProductCatalogSlice } from "@/modules/catalog/contracts/product-catalog.functions";
import type { ProductCatalogSliceRequestDto } from "@/modules/catalog/contracts/product-catalog.contracts";

const catalogUiSchema = z.object({
  orgId: z.string().uuid(),
  brandName: z.string().min(2),
  modelName: z.string().min(2),
  specifications: z.string().min(3),
  componentModelIds: z.string(),
});

type CatalogUiForm = z.infer<typeof catalogUiSchema>;

const defaults: CatalogUiForm = {
  orgId: "11111111-1111-1111-1111-111111111111",
  brandName: "SolarEdge",
  modelName: "SE12K-Pro",
  specifications: "power=12kW,voltage=400V,phase=3",
  componentModelIds: "88888888-8888-8888-8888-888888888888",
};

function mapCatalogUiToRequest(input: CatalogUiForm): ProductCatalogSliceRequestDto {
  const specs: Record<string, string> = {};
  input.specifications
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [key, value] = pair.split("=").map((v) => v.trim());
      if (key && value) specs[key] = value;
    });

  return {
    orgId: input.orgId,
    brand: {
      name: input.brandName,
    },
    model: {
      name: input.modelName,
      specifications: specs,
      componentModelIds: input.componentModelIds.split(",").map((v) => v.trim()).filter(Boolean),
    },
  };
}

export function ProductCatalogPanel() {
  const runSlice = useServerFn(runProductCatalogSlice);
  const [form, setForm] = React.useState(defaults);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof runSlice>> | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Catalog Module</CardTitle>
        <CardDescription>Brands + models + specifications + component relationships</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AsyncStateBanner state={status} errorMessage={error ?? undefined} loadingLabel="Running catalog slice..." />
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={form.brandName} onChange={(e) => setForm((p) => ({ ...p, brandName: e.target.value }))} aria-label="Brand name" />
          <Input value={form.modelName} onChange={(e) => setForm((p) => ({ ...p, modelName: e.target.value }))} aria-label="Model name" />
          <Input value={form.specifications} onChange={(e) => setForm((p) => ({ ...p, specifications: e.target.value }))} aria-label="Specifications key=value CSV" />
          <Input value={form.componentModelIds} onChange={(e) => setForm((p) => ({ ...p, componentModelIds: e.target.value }))} aria-label="Component model IDs CSV" />
        </div>
        <Button
          className="h-11"
          onClick={async () => {
            const parsed = catalogUiSchema.safeParse(form);
            if (!parsed.success) {
              setStatus("error");
              setError(parsed.error.issues[0]?.message ?? "Invalid input");
              return;
            }
            setStatus("loading");
            setError(null);
            try {
              const response = await runSlice({ data: mapCatalogUiToRequest(parsed.data) });
              setResult(response);
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setError(err instanceof Error ? err.message : "Catalog slice failed");
            }
          }}
        >
          Run Product Catalog Slice
        </Button>
        {result ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Brand {result.brandId.slice(0, 8)}</Badge>
            <Badge variant="secondary">Model {result.modelId.slice(0, 8)}</Badge>
            <Badge variant="outline">Specs {result.specificationsCount}</Badge>
            <Badge variant="outline">Relationships {result.componentRelationshipCount}</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}