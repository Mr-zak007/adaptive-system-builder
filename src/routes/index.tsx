import { createFileRoute } from "@tanstack/react-router";
import { VerticalSliceWorkflowScreen } from "@/modules/shared-orchestration/ui/vertical-slice-workflow-screen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeBasePanel } from "@/modules/knowledge/ui/knowledge-base-panel";
import { ErrorIntelligencePanel } from "@/modules/error-intelligence/ui/error-intelligence-panel";
import { InstallationProjectsPanel } from "@/modules/installations/ui/installation-projects-panel";
import { ProductCatalogPanel } from "@/modules/catalog/ui/product-catalog-panel";
import { ClientSolarManagementPanel } from "@/modules/asset-registry/ui/client-solar-management-panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operational Workflow Validation" },
      {
        name: "description",
        content: "Workflow-first operational workspace for core field operations modules.",
      },
      { property: "og:title", content: "Operational Workflow Validation" },
      {
        property: "og:description",
        content: "Workflow-first operational workspace for core field operations modules.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-dvh bg-background p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Operational Workspace</h1>
        <Tabs defaultValue="workflow" className="w-full">
          <TabsList className="h-auto w-full justify-start overflow-auto">
            <TabsTrigger value="workflow">Ticket Workflow</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="error">Error Intelligence</TabsTrigger>
            <TabsTrigger value="installation">Installation Projects</TabsTrigger>
            <TabsTrigger value="catalog">Product Catalog</TabsTrigger>
            <TabsTrigger value="client">Client & Solar</TabsTrigger>
          </TabsList>
          <TabsContent value="workflow">
            <VerticalSliceWorkflowScreen />
          </TabsContent>
          <TabsContent value="knowledge">
            <KnowledgeBasePanel />
          </TabsContent>
          <TabsContent value="error">
            <ErrorIntelligencePanel />
          </TabsContent>
          <TabsContent value="installation">
            <InstallationProjectsPanel />
          </TabsContent>
          <TabsContent value="catalog">
            <ProductCatalogPanel />
          </TabsContent>
          <TabsContent value="client">
            <ClientSolarManagementPanel />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
