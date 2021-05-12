import { Static, TSchema, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fastJSON from "fast-json-stringify";
import { HTTPMethod } from "find-my-way";
import { Spatula } from "./spatula";
import { Params, Prettier } from "./types";
import { isBuffer, isString } from "./utils";
import { Wok } from "./wok";

type Infer<T> = Prettier<Static<T>>;

export const t = Type;

export interface IRoute {
  method: HTTPMethod;
  path: string;
  run: Route["run"];
}

export type Ctx<Method, Params, Query, Body> = {
  method: Method;
  url: string;
  params: Params;
  query: Query;
  body: Body;
  status(code: number): Ctx<Method, Params, Query, Body>;
  header(key: string, value: string): Ctx<Method, Params, Query, Body>;
};

export type Handler<Method, Params, Query, Body, Return> = (
  ctx: Ctx<Method, Params, Query, Body>
) => Return | Promise<Return>;

const ajv = new Ajv({ useDefaults: true, coerceTypes: true, strict: false });

export type TRoute<
  TMethod extends HTTPMethod,
  TPath extends string,
  TParams extends Record<string, unknown> = Params<TPath>,
  TQuery extends Record<string, unknown> = {},
  TBody = unknown,
  TResponse = unknown,
  TUsed extends string = never
> = Omit<Route<TMethod, TPath, TParams, TQuery, TBody, TResponse, TUsed>, TUsed>;

export function route<Method extends HTTPMethod, Path extends string>(method: Method, path: Path) {
  return new Route(method, path);
}

export class Route<
  TMethod extends HTTPMethod = HTTPMethod,
  TPath extends string = never,
  TParams extends Record<string, unknown> = Prettier<Params<TPath>>,
  TQuery extends Record<string, unknown> = {},
  TBody = unknown,
  TResponse = unknown,
  TUsed extends string = never
> extends Wok {
  constructor(readonly method: TMethod, readonly path: TPath) {
    super();
  }

  run(spatula: Spatula<TMethod>, params: TParams) {
    const action = async () => {
      const { url, method, query, body } = spatula;

      if (!this.#queryValidate(query)) {
        throw new Error(`query: ${ajv.errorsText()}`);
      }

      if (!this.#bodyValidate(body)) {
        throw new Error(`query: ${ajv.errorsText()}`);
      }

      const ctx: Ctx<TMethod, TParams, TQuery, TBody> = {
        params,
        url,
        method,
        query,
        body,
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
      this.send(spatula, data);
    };

    return this.spoon(spatula, action);
  }

  #queryValidate = (_: unknown): _ is TQuery => true;
  query<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, Infer<S>, TBody, TResponse, TUsed | "query"> {
    this.#queryValidate = (query): query is TQuery => ajv.validate(schema, query);
    // @ts-ignore
    return this;
  }

  #bodyValidate = (_: unknown): _ is TBody => true;
  body<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, Infer<S>, TResponse, TUsed | "body"> {
    this.#bodyValidate = (body): body is TBody => {
      return ajv.validate(schema, body);
    };
    // @ts-ignore
    return this;
  }

  #responseStringify = JSON.stringify;
  response<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, Infer<S>, TUsed | "response"> {
    this.#responseStringify = fastJSON(schema);
    // @ts-ignore: 类型
    return this;
  }

  #handler: Handler<TMethod, TParams, TQuery, TBody, TResponse> = DEFAULT_HANDLER;
  handle(
    handler: Handler<TMethod, TParams, TQuery, TBody, TResponse>
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, TResponse, TUsed | "handle"> {
    this.#handler = handler;
    // @ts-ignore: 类型
    return this;
  }

  private send(spatula: Spatula, data: unknown) {
    if (isString(data)) {
      spatula
        .header("Content-Type", "text/plain") // plain
        .send(data);
      return;
    }

    if (isBuffer(data)) {
      spatula.send(data);
      return;
    }

    spatula
      .header("Content-Type", "application/json") // json header
      .send(this.#responseStringify(data));
  }
}

const DEFAULT_HANDLER: Handler<any, any, any, any, any> = (ctx) => {
  ctx.status(404);
  return {
    status: 404,
    message: `${ctx.url} not implement.`,
  };
};
