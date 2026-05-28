import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AsyncStateBanner } from "@/components/system/async-state";
import { runInstallationProjectsSlice } from "@/modules/installations/contracts/installation-projects.functions";
import type { InstallationSliceRequestDto } from "@/modules/installations/contracts/installation-projects.contracts";

const installationUiSchema = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(3),
  siteName: z.string().min(3),
  lifecycle: z.enum(["planned", "active", "handover", "completed"]),
  moveToLifecycle: z.enum(["planned", "active", "handover", "completed"]),
  taskTitle: z.string().min(3),
  taskStatus: z.enum(["pending", "in_progress", "done"]),
  assignedTo: z.string().uuid(),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

type InstallationUiForm = z.infer<typeof installationUiSchema>;

const defaults: InstallationUiForm = {
  orgId: "11111111-1111-1111-1111-111111111111",
  name: "North Site PV Upgrade",
  siteName: "North Campus",
  lifecycle: "planned",
  moveToLifecycle: "active",
  taskTitle: "Mount inverter rack",
  taskStatus: "in_progress",
  assignedTo: "77777777-7777-7777-7777-777777777777",
  fileName: "handover-checklist.pdf",
  fileType: "application/pdf",
};

function mapInstallationUiToRequest(input: InstallationUiForm): InstallationSliceRequestDto {
  return {
    orgId: input.orgId,
    project: {
      name: input.name,
      siteName: input.siteName,
      lifecycle: input.lifecycle,
    },
    task: {
      title: input.taskTitle,
      status: input.taskStatus,
      assignedTo: input.assignedTo,
    },
    document: {
      fileName: input.fileName,
      fileType: input.fileType,
    },
    moveToLifecycle: input.moveToLifecycle,
  };
}

export function InstallationProjectsPanel() {
  const runSlice = useServerFn(runInstallationProjectsSlice);
  const [form, setForm] = React.useState(defaults);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof runSlice>> | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Installation Projects Module</CardTitle>
        <CardDescription>Project lifecycle + tasks + handover docs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <AsyncStateBanner state={status} errorMessage={error ?? undefined} loadingLabel="Running installation slice..." />
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} aria-label="Project name" />
          <Input value={form.siteName} onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value }))} aria-label="Site name" />
          <Input value={form.lifecycle} onChange={(e) => setForm((p) => ({ ...p, lifecycle: e.target.value as InstallationUiForm["lifecycle"] }))} aria-label="Current lifecycle" />
          <Input value={form.moveToLifecycle} onChange={(e) => setForm((p) => ({ ...p, moveToLifecycle: e.target.value as InstallationUiForm["moveToLifecycle"] }))} aria-label="Next lifecycle" />
          <Input value={form.taskTitle} onChange={(e) => setForm((p) => ({ ...p, taskTitle: e.target.value }))} aria-label="Task title" />
          <Input value={form.taskStatus} onChange={(e) => setForm((p) => ({ ...p, taskStatus: e.target.value as InstallationUiForm["taskStatus"] }))} aria-label="Task status" />
          <Input value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))} aria-label="Assigned user" />
          <Input value={form.fileName} onChange={(e) => setForm((p) => ({ ...p, fileName: e.target.value }))} aria-label="Document name" />
        </div>
        <Input value={form.fileType} onChange={(e) => setForm((p) => ({ ...p, fileType: e.target.value }))} aria-label="Document type" />
        <Button
          className="h-11"
          onClick={async () => {
            const parsed = installationUiSchema.safeParse(form);
            if (!parsed.success) {
              setStatus("error");
              setError(parsed.error.issues[0]?.message ?? "Invalid input");
              return;
            }
            setStatus("loading");
            setError(null);
            try {
              const response = await runSlice({ data: mapInstallationUiToRequest(parsed.data) });
              setResult(response);
              setStatus("success");
            } catch (err) {
              setStatus("error");
              setError(err instanceof Error ? err.message : "Installation slice failed");
            }
          }}
        >
          Run Installation Slice
        </Button>
        {result ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Project {result.projectId.slice(0, 8)}</Badge>
            <Badge variant="secondary">Task {result.taskId.slice(0, 8)}</Badge>
            <Badge variant="secondary">Doc {result.documentId.slice(0, 8)}</Badge>
            <Badge variant="outline">Lifecycle {result.lifecycle}</Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}