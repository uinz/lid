import type { Spatula } from "./spatula";

export type { HTTPMethod } from "find-my-way";
export type Prettier<T> = T extends object ? { [K in keyof T]: Prettier<T[K]> } : T;
export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export type Split<T, S extends string> = T extends `${infer A}${S}${infer B}` ? A | Split<B, S> : T;

type SepSlash<T> = Exclude<Split<T, "/">, "">;

type SepParam<T> = T extends `${string}:${infer A}(${string})${infer B}`
  ? A | SepParam<B>
  : T extends `${string}:${infer A}-:${infer B}`
  ? A | SepParam<`:${B}`>
  : T extends `${string}:${infer A}`
  ? A
  : never;

export type Params<T extends string> = { [K in SepParam<SepSlash<T>>]: string };

export type Fn = (...args: any[]) => any;
export type Next = () => Promise<void>;
export type Middleware = (spatula: Spatula, next: Next) => Promise<void>;