import { createServer, Server, CompatServiceDefinition } from 'nice-grpc';
import type { GrpcTlsEnvConfig } from '../config/grpc-tls.config';
import { getGrpcServerCredentials } from './grpc-server-credentials.util';
import { createGrpcLoggingMiddleware, type GrpcRequestLogger } from './grpc-logging.middleware';
import { wrapGrpcImplementation } from './grpc-server.util';

type ServiceRegistration = {
  definition: CompatServiceDefinition;
  implementation: object;
};

/** Manage a nice-grpc server lifecycle (add services, listen, shutdown). */
export class GrpcServerRunner {
  private readonly server: Server = createServer();

  /** Register request logging for all RPCs on this server. Call before {@link listen}. */
  enableLogging(logger: GrpcRequestLogger): void {
    this.server.use(createGrpcLoggingMiddleware(logger));
  }

  add(registration: ServiceRegistration): void {
    this.server.add(registration.definition, wrapGrpcImplementation(registration.implementation));
  }

  listen(
    host: string,
    port: string | number,
    useTls: boolean,
    tlsConfig?: GrpcTlsEnvConfig,
  ): Promise<number> {
    return this.server.listen(`${host}:${port}`, getGrpcServerCredentials(useTls, tlsConfig));
  }

  shutdown(): Promise<void> {
    return this.server.shutdown();
  }
}
