export interface DtoMapper<TDomain, TTransport> {
  toTransport(domain: TDomain): TTransport;
}

// Rule: transport DTO mapping is explicit and one-way from domain/application output.
// Never return repository/database records directly from server functions.