export type { Split, Awaited, Fn, Prettier } from "./types";

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isRegExp(v: unknown): v is RegExp {
  return v instanceof RegExp;
}

export function capitalize<T extends string>(s: T): Capitalize<T> {
  let r = "";
  if (s) {
    r = s[0]?.toUpperCase() + s.slice(1);
  }
  return r as Capitalize<T>;
}

export function uncapitalize<T extends string>(s: T): Uncapitalize<T> {
  let r = "";
  if (s) {
    r = s[0]?.toLowerCase() + s.slice(1);
  }
  return r as Uncapitalize<T>;
}

/**
 * assert is item in arr
 * @param arr
 * @param item
 */
export function includes<T>(arr: T[], item: unknown): item is T {
  // @ts-ignore: improve includes
  return arr.includes(item);
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  let promise = new Promise<T>((res, rej) => {
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

export function noop(..._args: any[]): any {
  // noop
}
