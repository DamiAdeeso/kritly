import type { ServiceResponse } from '../dto/common.dto';

/** HTTP error envelope returned by wrapped gRPC clients when the RPC fails (data is null). */
export type HttpClientErrorResponse = ServiceResponse<null>;
