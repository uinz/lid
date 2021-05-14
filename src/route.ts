import { Static, TSchema, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import ajvFormats from "ajv-formats";
import fastJSON from "fast-json-stringify";
import { HTTPMethod } from "find-my-way";
import createHttpError from "http-errors";
import { Spatula } from "./spatula";
import { Params, Prettier } from "./types";
import { isBuffer, isString } from "./utils";
import { Wok } from "./wok";

type Infer<T> = Prettier<Static<T>>;

export const t = Type;

export interface IRoute {
  method: HTTPMethod;
  path: string;
  handleRequest: Route["handleRequest"];
}

export type Handler<
  Method extends HTTPMethod = any,
  Path extends string = any,
  Params extends object = any,
  Query extends object = any,
  Body = any,
  Return = any
> = (spatula: Spatula<Method, Path, Params, Query, Body>) => Return | Promise<Return>;

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

const ajv = ajvFormats(
  new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    strict: false,
  })
);

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

  private assets(
    spatula: Spatula
  ): asserts spatula is Spatula<TMethod, TPath, TParams, TQuery, TBody> {
    if (!this.#queryValidate(spatula.query)) {
      throw createHttpError(400, ajv.errorsText(ajv.errors, { dataVar: "query" }));
    }
    if (!this.#bodyValidate(spatula.body)) {
      throw createHttpError(400, ajv.errorsText(ajv.errors, { dataVar: "body" }));
    }
  }

  async handleRequest(spatula: Spatula) {
    await this.stack()(spatula, async () => {
      this.assets(spatula);
      const result = await this.#handler(spatula);
      this.end(spatula, this.#responseStringify(result));
    });
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
    this.#bodyValidate = (body): body is TBody => ajv.validate(schema, body);
    // @ts-ignore
    return this;
  }

  #responseStringify = JSON.stringify;
  response<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, Infer<S>, TUsed | "response"> {
    this.#responseStringify = fastJSON(schema);
    // @ts-ignore: types
    return this;
  }

  #handler: Handler<TMethod, TPath, TParams, TQuery, TBody, TResponse> = DEFAULT_HANDLER;
  handle(
    handler: Handler<TMethod, TPath, TParams, TQuery, TBody, TResponse>
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, TResponse, TUsed | "handle"> {
    this.#handler = handler;
    // @ts-ignore: types
    return this;
  }

  private end(spatula: Spatula, data: unknown) {
    if (isString(data)) {
      spatula
        .header("Content-Type", "text/plain") // plain
        .end(data);
      return;
    }

    if (isBuffer(data)) {
      spatula.end(data);
      return;
    }

    spatula
      .header("Content-Type", "application/json") // json header
      .end(this.#responseStringify(data));
  }
}

const DEFAULT_HANDLER: Handler<any, any, any, any, any> = (ctx) => {
  ctx.status(404);
  return {
    status: 404,
    message: `${ctx.url} not implement.`,
  };
};
