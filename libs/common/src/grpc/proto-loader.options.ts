/** Shared @grpc/proto-loader options — use on every gRPC server and client. */
export const GRPC_PROTO_LOADER_OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
} as const;
