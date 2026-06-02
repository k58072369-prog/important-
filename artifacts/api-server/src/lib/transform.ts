type AnyObject = Record<string, unknown>;

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function transformValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(transformValue);
  if (typeof value === "object") return toSnakeCase(value as AnyObject);
  return value;
}

export function toSnakeCase(obj: AnyObject): AnyObject {
  const result: AnyObject = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = transformValue(value);
  }
  return result;
}

export function toSnakeCaseArray(arr: AnyObject[]): AnyObject[] {
  return arr.map(toSnakeCase);
}
