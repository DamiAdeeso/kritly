type StringKeyed = Record<string, unknown>;

function snakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Read a field from a gRPC JSON object (camelCase or snake_case). */
export function grpcField<T>(payload: StringKeyed | undefined, key: string): T | undefined {
  if (!payload) {
    return undefined;
  }

  const value = payload[key] ?? payload[snakeCase(key)];
  return value as T | undefined;
}

export function grpcStatusCode(payload: StringKeyed): number | undefined {
  const code = grpcField<number | string>(payload, 'statusCode');
  if (typeof code === 'number') {
    return code;
  }
  if (typeof code === 'string' && code !== '') {
    return Number(code);
  }
  return undefined;
}

export function grpcData<T extends StringKeyed>(payload: StringKeyed): T | undefined {
  return grpcField<T>(payload, 'data');
}

export function grpcIsAvailable(data: StringKeyed | undefined): boolean | undefined {
  return grpcField<boolean>(data, 'isAvailable');
}

export function grpcIsValid(data: StringKeyed | undefined): boolean | undefined {
  return grpcField<boolean>(data, 'isValid');
}
