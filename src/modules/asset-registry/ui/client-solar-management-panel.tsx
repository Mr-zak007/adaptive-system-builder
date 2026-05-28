import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncStateBanner } from "@/components/system/async-state";
import { runClientSolarSlice } from "@/modules/asset-registry/contracts/client-solar-management.functions";
import type { ClientSolarSliceRequestDto } from "@/modules/asset-registry/contracts/client-solar-management.contracts";

const clientSolarUiSchema = z.object({
  orgId: z.string().uuid(),
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  clientPhone: z.string().min(7),
  systemName: z.string().min(2),
  systemLocation: z.string().min(2),
  componentType: z.string().min(2),
  serialNumber: z.string().min(2),
  componentStatus: z.enum(["active", "maintenance", "retired"]),
  historyEventType: z.string().min(2),
  historyNote: z.string().min(2),
});

type ClientSolarUiForm = z.infer<typeof clientSolarUiSchema>;

const defaults: ClientSolarUiForm = {
  orgId: "11111111-1111-1111-1111-111111111111",
  clientName: "Falcon Logistics",
  clientEmail: "ops@falcon-logistics.example",
  clientPhone: "+966500000000",
  systemName: "Warehouse Roof System",
  systemLocation: "Riyadh - Zone 3",
  componentType: "inverter",
  serialNumber: "INV-2026-0009",
  componentStatus: "active",
  historyEventType: "maintenance_note",
  historyNote: "Quarterly inspection completed with no alarms.",
};

function mapClientSolarUiToRequest(input: ClientSolarUiForm): ClientSolarSliceRequestDto {
  return {
    orgId: input.orgId,
    client: {
      name: input.clientName,
      email: input.clientEmail,
      phone: input.clientPhone,
    },
    system: {
      systemName: input.systemName,
      location: input.systemLocation,
    },
    component: {
      componentType: input.componentType,
      serialNumber: input.serialNumber,
      status: input.componentStatus,
    },
    historyEvent: {
      eventType: input.historyEventType,
      note: input.historyNote,
    },
  };
}

export function ClientSolarManagementPanel() {
  const runSlice = useServerFn(runClientSolarSlice);
  const [form, setForm] = React.useState(defaults);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof runSlice>> | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client & Solar System Management</CardTitle>
        <CardDescription>Client profile + system profile + components + history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AsyncStateBanner state={status} errorMessage={error ?? undefined} loadingLabel="Running client/system slice..." />
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} aria-label="Client name" />
          <Input value={form.clientEmail} onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} aria-label="Client email" />
          <Input value={form.clientPhone} onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} aria-label="Client phone" />
          <Input value={form.systemName} onChange={(e) => setForm((p) => ({ ...p, systemName: e.target.value }))} aria-label="System name" />
          <Input value={form.systemLocation} onChange={(e) => setForm((p) => ({ ...p, systemLocation: e.target.value }))} aria-label="System location" />
          <Input value={form.componentType} onChange={(e) => setForm((p) => ({ ...p, componentType: e.target.value }))} aria-label="Component type" />
          <Input value={form.serialNumber} onChange={(e) => setForm((p) => ({ ...p, serialNumber: e.target.value }))} aria-label="Serial number" />
          <Input value={form.componentStatus} onChange={(e) => setForm((p) => ({ ...p, componentStatus: e.target.value as ClientSolarUiForm["componentStatus"] }))} aria-label="Component status" />
          <Input value={form.historyEventType} onChange={(e) => setForm((p) => ({ ...p, historyEventType: e.target.value }))} aria-label="History event type" />
          <Input value={form.historyNote} onChange={(e) => setForm((p) => ({ ...p, historyNote: e.target.value }))} aria-label="History note" />
        </div>
        <Button
          className="h-11"
          onClick={async () => {
            const parsed = clientSolarUiSchema.safeParse(form);
            if (!parsed.success) {
              setStatus("error");
              setError(parsed.error.issues[0]?.message ?? "Invalid input");
              return;
            }
            setStatus("loading");
            setError(null);
            try {
              const response = await runSlice({ data: mapClientSolarUiToRequest(parsed.data) });
              setResult(response);
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setError(err instanceof Error ? err.message : "Client/system slice failed");
            }
          }}
        >
          Run Client/System Slice
        </Button>
        {result ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Client {result.clientId.slice(0, 8)}</Badge>
            <Badge variant="secondary">System {result.systemId.slice(0, 8)}</Badge>
            <Badge variant="secondary">Component {result.componentId.slice(0, 8)}</Badge>
            <Badge variant="outline">History {result.historyEventId.slice(0, 8)}</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}