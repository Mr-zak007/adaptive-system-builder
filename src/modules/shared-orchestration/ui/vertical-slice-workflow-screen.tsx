import * as React from "react";
import { CheckCircle2, Clock3, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { AsyncStateBanner } from "@/components/system/async-state";
import { useVerticalSliceWorkflow } from "@/modules/shared-orchestration/ui/use-vertical-slice-workflow";
import {
  workflowFormDefaults,
  mapWorkflowFormToRequest,
} from "@/modules/shared-orchestration/ui/vertical-slice-workflow.mapper";
import type { WorkflowFormModel } from "@/modules/shared-orchestration/ui/vertical-slice-workflow.contracts";

function ResultRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function VerticalSliceWorkflowScreen() {
  const [form, setForm] = React.useState<WorkflowFormModel>(workflowFormDefaults);
  const { state, run, retry, durationMs } = useVerticalSliceWorkflow();

  const progressValue = state.result?.summary.total
    ? Math.round((state.result.summary.passed / state.result.summary.total) * 100)
    : 0;

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Operational Workflow Validation
          </h1>
          <p className="text-sm text-muted-foreground">
            Ticket intake → assignment → task → attachment → resolution, with audit + correctness
            checks.
          </p>
        </header>

        <AsyncStateBanner
          state={state.status}
          loadingLabel="Running vertical slice workflow..."
          errorMessage={state.errorMessage ?? undefined}
          onRetry={retry}
        />

        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(form);
          }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Workflow Input</CardTitle>
              <CardDescription>
                Thin UI transport only; no business rules in component layer.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ticketTitle">Ticket intake</Label>
                <Input
                  id="ticketTitle"
                  value={form.ticketTitle}
                  onChange={(e) => setForm((p) => ({ ...p, ticketTitle: e.target.value }))}
                />
                <Textarea
                  value={form.ticketDescription}
                  onChange={(e) => setForm((p) => ({ ...p, ticketDescription: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignmentReason">Assignment reason</Label>
                <Input
                  id="assignmentReason"
                  value={form.assignmentReason}
                  onChange={(e) => setForm((p) => ({ ...p, assignmentReason: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="taskTitle">Field task execution</Label>
                <Input
                  id="taskTitle"
                  value={form.taskTitle}
                  onChange={(e) => setForm((p) => ({ ...p, taskTitle: e.target.value }))}
                />
                <Textarea
                  value={form.taskInstructions}
                  onChange={(e) => setForm((p) => ({ ...p, taskInstructions: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attachmentFileName">Attachment upload</Label>
                <Input
                  id="attachmentFileName"
                  value={form.attachmentFileName}
                  onChange={(e) => setForm((p) => ({ ...p, attachmentFileName: e.target.value }))}
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    aria-label="Attachment MIME type"
                    value={form.attachmentMimeType}
                    onChange={(e) => setForm((p) => ({ ...p, attachmentMimeType: e.target.value }))}
                  />
                  <Input
                    aria-label="Attachment size bytes"
                    type="number"
                    value={form.attachmentSizeBytes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, attachmentSizeBytes: Number(e.target.value || 0) }))
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resolutionSummary">Resolution + error code linking</Label>
                <Textarea
                  id="resolutionSummary"
                  value={form.resolutionSummary}
                  onChange={(e) => setForm((p) => ({ ...p, resolutionSummary: e.target.value }))}
                />
                <Input
                  aria-label="Error code id"
                  value={form.errorCodeId}
                  onChange={(e) => setForm((p) => ({ ...p, errorCodeId: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="includeFailureScenarios"
                  checked={form.includeFailureScenarios}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({ ...p, includeFailureScenarios: Boolean(checked) }))
                  }
                />
                <Label htmlFor="includeFailureScenarios">Include failure/retry scenarios</Label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-11 min-w-11">
                  Run workflow
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 min-w-11"
                  onClick={() => {
                    const payload = mapWorkflowFormToRequest(form);
                    void run({
                      ...form,
                      ...{ includeFailureScenarios: payload.includeFailureScenarios },
                    });
                  }}
                >
                  Run with current payload
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {state.result ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" /> Validation
                outcome
              </CardTitle>
              <CardDescription>
                Operational correctness and workflow speed evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progressValue} aria-label="Passed validations percentage" />
              <div className="grid gap-2 md:grid-cols-2">
                <ResultRow
                  label="Passed"
                  value={<Badge variant="secondary">{state.result.summary.passed}</Badge>}
                />
                <ResultRow
                  label="Failed"
                  value={<Badge variant="destructive">{state.result.summary.failed}</Badge>}
                />
                <ResultRow
                  label="Warnings"
                  value={<Badge variant="outline">{state.result.summary.warnings}</Badge>}
                />
                <ResultRow label="Duration" value={`${durationMs ?? 0}ms`} />
              </div>

              <Tabs defaultValue="lifecycle" className="w-full">
                <TabsList className="h-auto w-full justify-start overflow-auto">
                  <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
                  <TabsTrigger value="audit">Audit Timeline</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                </TabsList>
                <TabsContent value="lifecycle" className="space-y-2">
                  {state.result.lifecycle.map((item) => (
                    <div
                      key={item.scenario}
                      className="flex items-start gap-2 rounded-md border border-border p-2 text-sm"
                    >
                      {item.status === "passed" ? (
                        <CheckCircle2 className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                      ) : item.status === "warning" ? (
                        <Clock3
                          className="mt-0.5 size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <AlertTriangle
                          className="mt-0.5 size-4 text-destructive"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{item.scenario}</p>
                        <p className="text-muted-foreground">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="audit" className="space-y-2">
                  {state.result.auditTimeline.map((event) => (
                    <div
                      key={`${event.timestamp}-${event.action}`}
                      className="rounded-md border border-border p-2 text-sm"
                    >
                      <p className="font-medium text-foreground">{event.action}</p>
                      <p className="text-muted-foreground">
                        {event.stage} • {event.status}
                      </p>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="risks" className="space-y-2">
                  {state.result.architecturalReview.currentRisks.map((risk) => (
                    <div
                      key={risk}
                      className="rounded-md border border-border p-2 text-sm text-foreground"
                    >
                      {risk}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
