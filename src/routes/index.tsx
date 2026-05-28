import { createFileRoute } from "@tanstack/react-router";
import { VerticalSliceWorkflowScreen } from "@/modules/shared-orchestration/ui/vertical-slice-workflow-screen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operational Workflow Validation" },
      {
        name: "description",
        content: "Minimal workflow-first operational UI for ticket lifecycle validation.",
      },
      { property: "og:title", content: "Operational Workflow Validation" },
      {
        property: "og:description",
        content: "Minimal workflow-first operational UI for ticket lifecycle validation.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <VerticalSliceWorkflowScreen />;
}
