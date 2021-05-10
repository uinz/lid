export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isRegExp(v: unknown): v is RegExp {
  return v instanceof RegExp;
}
