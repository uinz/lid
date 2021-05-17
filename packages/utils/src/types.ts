export type Fn = (...args: any[]) => any;

export type Prettier<T> = T extends Fn
  ? T
  : T extends object
  ? { [K in keyof T]: Prettier<T[K]> }
  : T;

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

export type Split<T, S extends string> = T extends `${infer A}${S}${infer B}` ? A | Split<B, S> : T;
