import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncStateBanner } from "@/components/system/async-state";
import { runErrorIntelligenceSlice } from "@/modules/error-intelligence/contracts/error-intelligence-catalog.functions";
import type { ErrorIntelligenceSliceRequestDto } from "@/modules/error-intelligence/contracts/error-intelligence-catalog.contracts";

const errorUiSchema = z.object({
  orgId: z.string().uuid(),
  code: z.string().min(3),
  title: z.string().min(3),
  details: z.string().min(5),
  severity: z.enum(["low", "medium", "high", "critical"]),
  relatedSolutionIds: z.string(),
  linkedTicketIds: z.string(),
  linkTicketId: z.string().uuid(),
});

type ErrorUiForm = {
  orgId: string;
  code: string;
  title: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
  relatedSolutionIds: string;
  linkedTicketIds: string;
  linkTicketId: string;
};

const defaults: ErrorUiForm = {
  orgId: "11111111-1111-1111-1111-111111111111",
  code: "INV-DC-21",
  title: "DC connector instability",
  details: "Frequent disconnects under thermal expansion at noon peak.",
  severity: "high",
  relatedSolutionIds: "55555555-5555-5555-5555-555555555555",
  linkedTicketIds: "66666666-6666-6666-6666-666666666666",
  linkTicketId: "66666666-6666-6666-6666-666666666666",
};

function mapErrorUiToRequest(input: ErrorUiForm): ErrorIntelligenceSliceRequestDto {
  return {
    orgId: input.orgId,
    errorCode: {
      code: input.code,
      title: input.title,
      details: input.details,
      severity: input.severity,
      relatedSolutionIds: input.relatedSolutionIds.split(",").map((v) => v.trim()).filter(Boolean),
      linkedTicketIds: input.linkedTicketIds.split(",").map((v) => v.trim()).filter(Boolean),
    },
    linkTicketId: input.linkTicketId,
  };
}

export function ErrorIntelligencePanel() {
  const runSlice = useServerFn(runErrorIntelligenceSlice);
  const [form, setForm] = React.useState(defaults);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof runSlice>> | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Intelligence Module</CardTitle>
        <CardDescription>Error catalog + details + related solutions + statistics + ticket linking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AsyncStateBanner state={status} errorMessage={error ?? undefined} loadingLabel="Running error slice..." />
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} aria-label="Error code" />
          <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} aria-label="Error title" />
          <Input value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value as typeof defaults.severity }))} aria-label="Severity" />
          <Input value={form.linkTicketId} onChange={(e) => setForm((p) => ({ ...p, linkTicketId: e.target.value }))} aria-label="Link ticket" />
          <Input value={form.relatedSolutionIds} onChange={(e) => setForm((p) => ({ ...p, relatedSolutionIds: e.target.value }))} aria-label="Related solution IDs" />
          <Input value={form.linkedTicketIds} onChange={(e) => setForm((p) => ({ ...p, linkedTicketIds: e.target.value }))} aria-label="Linked ticket IDs" />
        </div>
        <Textarea value={form.details} onChange={(e) => setForm((p) => ({ ...p, details: e.target.value }))} aria-label="Error details" />
        <Button
          className="h-11"
          onClick={async () => {
            const parsed = errorUiSchema.safeParse(form);
            if (!parsed.success) {
              setStatus("error");
              setError(parsed.error.issues[0]?.message ?? "Invalid input");
              return;
            }
            setStatus("loading");
            setError(null);
            try {
              const response = await runSlice({ data: mapErrorUiToRequest(parsed.data) });
              setResult(response);
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setError(err instanceof Error ? err.message : "Error slice failed");
            }
          }}
        >
          Run Error Intelligence Slice
        </Button>
        {result ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Error {result.errorCodeId.slice(0, 8)}</Badge>
            <Badge variant="secondary">Ticket {result.linkedTicketId.slice(0, 8)}</Badge>
            <Badge variant="outline">Codes {result.statistics.totalErrorCodes}</Badge>
            <Badge variant="outline">Tickets {result.statistics.linkedTickets}</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}