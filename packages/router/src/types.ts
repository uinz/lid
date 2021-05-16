import { Split } from "@lid-http/utils";

type SepSlash<T> = Exclude<Split<T, "/">, "">;

type SepParam<T> = T extends `${string}:${infer A}(${string})${infer B}`
  ? A | SepParam<B>
  : T extends `${string}:${infer A}-:${infer B}`
  ? A | SepParam<`:${B}`>
  : T extends `${string}:${infer A}`
  ? A
  : never;

export type Params<T extends string> = { [K in SepParam<SepSlash<T>>]: string };
