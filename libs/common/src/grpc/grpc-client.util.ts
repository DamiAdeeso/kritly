import { isObservable, lastValueFrom, Observable } from 'rxjs';

/** Unwrap Nest gRPC client calls (Observable or Promise) into a single Promise. */
export async function grpcClientCall<T>(result: T | Observable<T>): Promise<Awaited<T>> {
  if (isObservable(result)) {
    return lastValueFrom(result) as Promise<Awaited<T>>;
  }
  return await result;
}

type GrpcService = Record<string, unknown>;

/** Resolve a gRPC stub method (camelCase or PascalCase RPC name). */
export function resolveGrpcMethod<T extends (...args: never[]) => unknown>(
  service: GrpcService,
  ...names: string[]
): T {
  for (const name of names) {
    const method = service[name];
    if (typeof method === 'function') {
      return method.bind(service) as T;
    }
  }

  throw new Error(`gRPC method not found on service (tried: ${names.join(', ')})`);
}
