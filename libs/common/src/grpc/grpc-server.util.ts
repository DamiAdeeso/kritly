import { toServerError } from './grpc-status.util';

type AsyncMethod = (...args: unknown[]) => Promise<unknown>;

/** Run a gRPC handler; Nest/HTTP exceptions become native {@link ServerError}. */
export async function runGrpcHandler<T>(handler: () => Promise<T>): Promise<T> {
  try {
    return await handler();
  } catch (exception) {
    throw toServerError(exception);
  }
}

function collectMethodNames(instance: object): string[] {
  const names = new Set<string>();
  let proto: object | null = instance;

  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key !== 'constructor') {
        names.add(key);
      }
    }
    proto = Object.getPrototypeOf(proto);
  }

  return [...names];
}

/** Wrap every method on a nice-grpc service implementation with native error propagation. */
export function wrapGrpcImplementation<T extends object>(implementation: T): T {
  const wrapped = {} as T;

  for (const key of collectMethodNames(implementation)) {
    const method = (implementation as Record<string, AsyncMethod | undefined>)[key];
    if (typeof method !== 'function') {
      continue;
    }

    (wrapped as Record<string, AsyncMethod>)[key] = (...args: unknown[]) =>
      runGrpcHandler(() => method.apply(implementation, args));
  }

  return wrapped;
}
