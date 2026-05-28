import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncStateBanner } from "@/components/system/async-state";
import { runKnowledgeBaseSlice } from "@/modules/knowledge/contracts/knowledge-base.functions";
import type { KnowledgeBaseSliceRequestDto } from "@/modules/knowledge/contracts/knowledge-base.contracts";

const knowledgeUiSchema = z.object({
  orgId: z.string().uuid(),
  articleTitle: z.string().min(3),
  articleSummary: z.string().min(3),
  articleBody: z.string().min(10),
  articleTags: z.string(),
  solutionTitle: z.string().min(3),
  problemStatement: z.string().min(5),
  solutionSteps: z.string().min(3),
  effectivenessScore: z.number().min(0).max(100),
  linkedErrorCodeIds: z.string(),
  procedureTitle: z.string().min(3),
  procedureObjective: z.string().min(5),
  procedureSteps: z.string().min(3),
  searchQuery: z.string().min(1),
});

const defaults = {
  orgId: "11111111-1111-1111-1111-111111111111",
  articleTitle: "Inverter Fault Triage",
  articleSummary: "Runbook for rapid inverter diagnostics.",
  articleBody: "### Steps\n1. Verify input voltage\n2. Check error panel\n3. Capture photos",
  articleTags: "inverter,triage,field",
  solutionTitle: "Stabilize DC connector",
  problemStatement: "Intermittent inverter shutdown after midday load spike.",
  solutionSteps: "Inspect connector, reseat harness, verify thermal signature",
  effectivenessScore: 86,
  linkedErrorCodeIds: "44444444-4444-4444-4444-444444444444",
  procedureTitle: "On-site troubleshooting",
  procedureObjective: "Resolve recurring outage within one visit",
  procedureSteps: "Isolate circuit, test continuity, apply fix, validate",
  searchQuery: "inverter",
};

function mapKnowledgeUiToRequest(input: typeof defaults): KnowledgeBaseSliceRequestDto {
  return {
    orgId: input.orgId,
    article: {
      title: input.articleTitle,
      summary: input.articleSummary,
      bodyMarkdown: input.articleBody,
      tags: input.articleTags.split(",").map((v) => v.trim()).filter(Boolean),
    },
    provenSolution: {
      title: input.solutionTitle,
      problemStatement: input.problemStatement,
      solutionSteps: input.solutionSteps.split(",").map((v) => v.trim()).filter(Boolean),
      effectivenessScore: input.effectivenessScore,
      linkedErrorCodeIds: input.linkedErrorCodeIds.split(",").map((v) => v.trim()).filter(Boolean),
    },
    troubleshootingProcedure: {
      title: input.procedureTitle,
      objective: input.procedureObjective,
      procedureSteps: input.procedureSteps.split(",").map((v) => v.trim()).filter(Boolean),
    },
    search: {
      query: input.searchQuery,
    },
  };
}

export function KnowledgeBasePanel() {
  const runSlice = useServerFn(runKnowledgeBaseSlice);
  const [form, setForm] = React.useState(defaults);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof runSlice>> | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base Module</CardTitle>
        <CardDescription>Articles + Proven Solutions + Procedures + Search + Error Linking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AsyncStateBanner state={status} errorMessage={error ?? undefined} loadingLabel="Running knowledge slice..." />
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={form.articleTitle} onChange={(e) => setForm((p) => ({ ...p, articleTitle: e.target.value }))} aria-label="Article title" />
          <Input value={form.solutionTitle} onChange={(e) => setForm((p) => ({ ...p, solutionTitle: e.target.value }))} aria-label="Solution title" />
          <Textarea value={form.articleSummary} onChange={(e) => setForm((p) => ({ ...p, articleSummary: e.target.value }))} aria-label="Article summary" />
          <Textarea value={form.problemStatement} onChange={(e) => setForm((p) => ({ ...p, problemStatement: e.target.value }))} aria-label="Problem statement" />
          <Input value={form.solutionSteps} onChange={(e) => setForm((p) => ({ ...p, solutionSteps: e.target.value }))} aria-label="Solution steps CSV" />
          <Input value={form.linkedErrorCodeIds} onChange={(e) => setForm((p) => ({ ...p, linkedErrorCodeIds: e.target.value }))} aria-label="Linked error code IDs CSV" />
          <Input value={form.procedureTitle} onChange={(e) => setForm((p) => ({ ...p, procedureTitle: e.target.value }))} aria-label="Procedure title" />
          <Input value={form.searchQuery} onChange={(e) => setForm((p) => ({ ...p, searchQuery: e.target.value }))} aria-label="Search query" />
        </div>
        <Textarea value={form.articleBody} onChange={(e) => setForm((p) => ({ ...p, articleBody: e.target.value }))} aria-label="Article body" />
        <Textarea value={form.procedureObjective} onChange={(e) => setForm((p) => ({ ...p, procedureObjective: e.target.value }))} aria-label="Procedure objective" />
        <Textarea value={form.procedureSteps} onChange={(e) => setForm((p) => ({ ...p, procedureSteps: e.target.value }))} aria-label="Procedure steps" />
        <Button
          className="h-11"
          onClick={async () => {
            const parsed = knowledgeUiSchema.safeParse(form);
            if (!parsed.success) {
              setStatus("error");
              setError(parsed.error.issues[0]?.message ?? "Invalid input");
              return;
            }
            setStatus("loading");
            setError(null);
            try {
              const response = await runSlice({ data: mapKnowledgeUiToRequest(parsed.data) });
              setResult(response);
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setError(err instanceof Error ? err.message : "Knowledge slice failed");
            }
          }}
        >
          Run Knowledge Slice
        </Button>
        {result ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Article {result.articleId.slice(0, 8)}</Badge>
            <Badge variant="secondary">Solution {result.solutionId.slice(0, 8)}</Badge>
            <Badge variant="secondary">Procedure {result.procedureId.slice(0, 8)}</Badge>
            <Badge variant="outline">Search hits {result.searchResults.length}</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}