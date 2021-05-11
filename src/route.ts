import { Static, TSchema, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fastJSON from "fast-json-stringify";
import { HTTPMethod } from "find-my-way";
import { Spatula } from "./spatula";
import { Params, Prettier } from "./types";
import { isBuffer, isString } from "./utils";
import { Wok } from "./wok";

const SPEC: Record<string, TSchema> = {};

export interface MRoute {
  method: HTTPMethod;
  path: string;
  run: Route["run"];
}

type Infer<T> = Prettier<Static<T>>;

type Handler<Method, Params, Query, Body> = (ctx: {
  method: Method;
  url: string;
  params: Params;
  query: Query;
  status(code: number): typeof ctx;
  header(key: string, value: string): typeof ctx;
}) => Body | Promise<Body>;

const ajv = new Ajv({ useDefaults: true, coerceTypes: true, strict: false });

export type TRoute<
  TMethod extends HTTPMethod,
  TPath extends string,
  TParams extends Record<string, unknown> = Params<TPath>,
  TQuery extends Record<string, unknown> = {},
  TBody = unknown,
  TUsed extends string = never
> = Omit<Route<TMethod, TPath, TParams, TQuery, TBody, TUsed>, TUsed>;

export function route<Method extends HTTPMethod, Path extends string>(method: Method, path: Path) {
  return new Route(method, path);
}

export class Route<
  TMethod extends HTTPMethod = never,
  TPath extends string = never,
  TParams extends Record<string, unknown> = Params<TPath>,
  TQuery extends Record<string, unknown> = {},
  TBody = unknown,
  TUsed extends string = never
> extends Wok {
  constructor(readonly method: TMethod, readonly path: TPath) {
    super();
  }

  run(spatula: Spatula, params: TParams) {
    const action = async () => {
      const { query } = spatula;
      if (!this.#queryValidate(query)) {
        throw new Error(`query: ${ajv.errorsText()}`);
      }

      const { url, method } = spatula;
      const ctx = {
        params,
        url,
        method: method as TMethod,
        query,
        status(code: number) {
          spatula.status(code);
          return ctx;
        },
        header(key: string, value: string) {
          spatula.header(key, value);
          return ctx;
        },
      };
      const data = await this.#handler(ctx);
      this.response(spatula, data);
    };

    return this.spoon(spatula, action);
  }

  #queryValidate = (query: unknown): query is TQuery => true;
  query<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, Infer<S>, TBody, TUsed | "query"> {
    this.#queryValidate = (query): query is TQuery => ajv.validate(schema, query);
    // @ts-ignore
    return this;
  }

  #bodyStringify = JSON.stringify;
  body<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, Infer<S>, TUsed | "body"> {
    this.#bodyStringify = fastJSON(schema);
    // @ts-ignore: 类型
    return this;
  }

  #handler: Handler<TMethod, TParams, TQuery, TBody> = DEFAULT_HANDLER;
  handle(
    handler: Handler<TMethod, TParams, TQuery, TBody>
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, TUsed | "handle"> {
    this.#handler = handler;
    // @ts-ignore: 类型
    return this;
  }

  private response(spatula: Spatula, data: unknown) {
    if (isString(data)) {
      spatula
        .header("Content-Type", "text/plain") // plain
        .response(data);
      return;
    }

    if (isBuffer(data)) {
      spatula.response(data);
      return;
    }

    spatula
      .header("Content-Type", "application/json") // header
      .response(this.#bodyStringify(data));
  }
}

export function openAPI(path: string): MRoute {
  return route("GET", path).handle(() => SPEC);
}

export const t = Type;

const DEFAULT_HANDLER: Handler<any, any, any, any> = (ctx) => {
  ctx.status(404);
  return {
    status: 404,
    message: `${ctx.url} not implement.`,
  };
};
