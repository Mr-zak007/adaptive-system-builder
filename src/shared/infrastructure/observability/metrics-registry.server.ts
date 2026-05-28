export type InfrastructureMetricName =
  | "assignment_workflow_ms"
  | "ticket_timeline_query_ms"
  | "attachment_heavy_query_ms"
  | "event_write_ms"
  | "audit_write_ms";

export interface MetricsSample {
  name: InfrastructureMetricName;
  valueMs: number;
  tags: Record<string, string>;
}

export interface PerformanceBaseline {
  assignmentWorkflowP95Ms: number;
  ticketTimelineQueryP95Ms: number;
  attachmentHeavyScenarioP95Ms: number;
  eventWriteP95Ms: number;
  auditWriteP95Ms: number;
}

function p95(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
}

export class InMemoryMetricsRegistry {
  private readonly samples: MetricsSample[] = [];

  record(sample: MetricsSample) {
    this.samples.push(sample);
  }

  computeBaseline(): PerformanceBaseline {
    const byName = (name: InfrastructureMetricName) => this.samples.filter((s) => s.name === name).map((s) => s.valueMs);

    return {
      assignmentWorkflowP95Ms: p95(byName("assignment_workflow_ms")),
      ticketTimelineQueryP95Ms: p95(byName("ticket_timeline_query_ms")),
      attachmentHeavyScenarioP95Ms: p95(byName("attachment_heavy_query_ms")),
      eventWriteP95Ms: p95(byName("event_write_ms")),
      auditWriteP95Ms: p95(byName("audit_write_ms")),
    };
  }
}
