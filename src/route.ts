import { Static, TSchema, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fastJSON from "fast-json-stringify";
import { HTTPMethod } from "find-my-way";
import querystring from "querystring";
import { Spatula } from "./spatula";
import { Params, Prettier } from "./types";
import { isBuffer, isString } from "./utils";
import { Wok } from "./wok";

type Infer<T> = Prettier<Static<T>>;

type Handler<Method, Params, Query, Body> = (ctx: {
  method: Method;
  url: string;
  params: Params;
  query: Query;
}) => Body | Promise<Body>;

const ajv = new Ajv({ useDefaults: true, coerceTypes: true, strict: false });

export type TRoute<
  TMethod extends HTTPMethod,
  TPath extends string,
  TParams extends Record<string, unknown> = Params<TPath>,
  TQuery extends Record<string, unknown> = {},
  TBody = void,
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
  TBody = void,
  TUsed extends string = never
> extends Wok {
  constructor(readonly method: TMethod, readonly path: TPath) {
    super();
  }

  run(spatula: Spatula, params: TParams) {
    const action = async () => {
      if (!this.#handler) {
        throw new Error(`${this.path} no handler`);
      }
      const { query } = spatula;
      if (!this.#queryValidate(query)) {
        throw new Error(`query: ${ajv.errorsText()}`);
      }

      const { url, method } = spatula;
      const data = await this.#handler({
        params,
        url,
        method: method as TMethod,
        query,
      });
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

  private parseQuery<T extends object>(url: string) {
    let query = {} as T;
    const i = url.indexOf("?");
    if (i !== -1) {
      const str = url.slice(i + 1);
      query = { ...querystring.parse(str) } as T;
    }
    if (!this.#queryValidate(query)) {
      throw new Error(`query wrong: ${ajv.errorsText()}`);
    }
    return query;
  }

  #bodyStringify = JSON.stringify;
  body<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, Infer<S>, TUsed | "body"> {
    this.#bodyStringify = fastJSON(schema);
    // @ts-ignore: 类型
    return this;
  }

  #handler?: Handler<TMethod, TParams, TQuery, TBody>;
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

export const t = Type;
