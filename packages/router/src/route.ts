import { Spatula } from "@lid-http/core";
import { isString, Prettier } from "@lid-http/utils";
import { Static, TSchema } from "@sinclair/typebox";
import fastJSON from "fast-json-stringify";
import { HTTPMethod } from "find-my-way";
import createHttpError from "http-errors";
import { ajv, ErrorObject } from "./ajv";
import { Params } from "./types";

type Infer<T> = Prettier<Static<T>>;

type TRoute<
  TMethod extends HTTPMethod,
  TPath extends string,
  TParams extends Record<string, unknown> = Params<TPath>,
  TQuery extends Record<string, unknown> = {},
  TBody = any,
  TResponse = any,
  TUsed extends string = any
> = Omit<Route<TMethod, TPath, TParams, TQuery, TBody, TResponse, TUsed>, TUsed>;

type Handler<
  Method extends HTTPMethod = any,
  Path extends string = any,
  Params extends object = any,
  Query extends object = any,
  Body = any,
  Return = any
> = (spatula: Spatula<Method, Path, Params, Query, Body>) => Return | Promise<Return>;

const DEFAULT_HANDLER: Handler<any, any, any, any, any> = () =>
  Promise.reject(createHttpError(404));

const DEFAULT_VALIDATE: Validate<any> = (_): _ is any => true;

/**
 * config route
 */
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
> {
  constructor(readonly method: TMethod, readonly path: TPath) {}

  async handlerRequest(spatula: Spatula) {
    this.assets(spatula);
    let result = await this.#handler(spatula);
    this.send(spatula, result);
  }

  #queryValidate: Validate<TQuery> = DEFAULT_VALIDATE;
  query<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, Infer<S>, TBody, TResponse, TUsed | "query"> {
    this.#queryValidate = ajv.compile(schema);
    return this as any;
  }

  #bodyValidate: Validate<TBody> = DEFAULT_VALIDATE;
  body<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, Infer<S>, TResponse, TUsed | "body"> {
    this.#bodyValidate = ajv.compile(schema);
    return this as any;
  }

  #responseStringify = JSON.stringify;
  response<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, Infer<S>, TUsed | "response"> {
    this.#responseStringify = fastJSON(schema);
    return this as any;
  }

  #handler: Handler<TMethod, TPath, TParams, TQuery, TBody, TResponse> = DEFAULT_HANDLER;
  handle(
    handler: Handler<TMethod, TPath, TParams, TQuery, TBody, TResponse>
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, TResponse, TUsed | "handle"> {
    this.#handler = handler;
    return this as any;
  }

  private assets(
    spatula: Spatula
  ): asserts spatula is Spatula<TMethod, TPath, TParams, TQuery, TBody> {
    if (!this.#queryValidate(spatula.query)) {
      throw createHttpError(400, ajv.errorsText(this.#queryValidate.errors, { dataVar: "query" }));
    }
    if (!this.#bodyValidate(spatula.body)) {
      throw createHttpError(400, ajv.errorsText(this.#bodyValidate.errors, { dataVar: "body" }));
    }
  }

  private send(spatula: Spatula, data: unknown) {
    if (isString(data)) {
      spatula
        .header("Content-Type", "text/plain") // plain
        .send(data);
      return;
    }

    if (Buffer.isBuffer(data)) {
      spatula.send(data);
      return;
    }

    spatula
      .header("Content-Type", "application/json") // json header
      .send(this.#responseStringify(data));
  }
}

interface Validate<T> {
  (arg: unknown): arg is T;
  errors?: ErrorObject[] | null;
}
