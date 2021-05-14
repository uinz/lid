export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isRegExp(v: unknown): v is RegExp {
  return v instanceof RegExp;
}

export function upperFirst<T extends string>(s: T) {
  type R = T extends `${infer A}${infer B}` ? `${Uppercase<A>}${B}` : T;
  let r = "" as R;
  if (s) {
    s[0]?.toUpperCase() + s.slice(1);
  }
  return r;
}

export function isBuffer(v: unknown): v is Buffer {
  return v instanceof Buffer;
}

export const { isArray } = Array;

/**
 * assert is item in arr
 * @param arr
 * @param item
 */
export function includes<T>(arr: T[], item: unknown): item is T {
  // @ts-ignore
  return arr.includes(item);
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

export function delay(t: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}
