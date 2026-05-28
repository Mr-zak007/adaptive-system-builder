export interface ClientSolarSliceRepository {
  createClient(input: {
    orgId: string;
    name: string;
    email: string;
    phone: string;
  }): Promise<{ id: string }>;
  createSystem(input: {
    orgId: string;
    clientId: string;
    systemName: string;
    location: string;
  }): Promise<{ id: string }>;
  createComponent(input: {
    orgId: string;
    systemId: string;
    componentType: string;
    serialNumber: string;
    status: "active" | "maintenance" | "retired";
  }): Promise<{ id: string }>;
  createHistoryEvent(input: {
    orgId: string;
    systemId: string;
    eventType: string;
    note: string;
  }): Promise<{ id: string }>;
}