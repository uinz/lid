import { isString } from "@lid-http/utils";
import { Static, TSchema } from "@sinclair/typebox";
import Ajv from "ajv";
import ajvFormats from "ajv-formats";
import fastJSON from "fast-json-stringify";
import findMyWay, { HTTPMethod } from "find-my-way";
import createHttpError from "http-errors";
import path from "path";
import { Spatula } from "./spatula";
import { Params, Prettier } from "./types";
import { Wok } from "./wok";

type Infer<T> = Prettier<Static<T>>;

interface MinRoute {
  method: HTTPMethod;
  path: string;
  handlerRequest(spatula: Spatula): void;
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
  TBody = any,
  TResponse = any,
  TUsed extends string = any
> = Omit<Route<TMethod, TPath, TParams, TQuery, TBody, TResponse, TUsed>, TUsed>;

const ajv = ajvFormats(
  new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    strict: false,
  })
);

class Route<
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

  #queryValidate = (_: unknown): _ is TQuery => true;
  query<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, Infer<S>, TBody, TResponse, TUsed | "query"> {
    this.#queryValidate = (query): query is TQuery => ajv.validate(schema, query);
    // @ts-ignore: for types
    return this;
  }

  #bodyValidate = (_: unknown): _ is TBody => true;
  body<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, Infer<S>, TResponse, TUsed | "body"> {
    this.#bodyValidate = (body): body is TBody => ajv.validate(schema, body);
    // @ts-ignore: for types
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

const DEFAULT_HANDLER: Handler<any, any, any, any, any> = () => {
  throw createHttpError(404);
};

export class Router extends Wok {
  readonly #routes = new WeakSet<MinRoute>();
  readonly #router = findMyWay({
    ignoreTrailingSlash: true,
    caseSensitive: false,
    defaultRoute() {
      throw createHttpError(404);
    },
  });

  constructor(readonly prefix = "/") {
    super();
  }

  mount(route: MinRoute | MinRoute[] | Record<string, MinRoute>) {
    if (isRoute(route)) {
      if (this.#routes.has(route)) {
        console.warn(`[${route.method}] ${route.path} already mount`);
        return;
      }
      let routePath = path.join(this.prefix, route.path);
      this.#router.on(
        route.method,
        routePath,
        function (this: { spatula: Spatula }, _req, _res, params) {
          this.spatula.params = params;
          return route.handlerRequest(this.spatula);
        }
      );
    } else {
      let routes = Array.isArray(route) ? route : Object.values(route);
      routes.forEach(this.mount, this);
    }
    return this;
  }

  routes() {
    this.use(async (spatula, next) => {
      await Promise.resolve(this.#router.lookup(spatula.req, spatula.res, { spatula }));
      return next();
    });
    this.routes = this.stack;
    return this.stack();
  }
}

export function route<Method extends HTTPMethod, Path extends string>(method: Method, path: Path) {
  return new Route(method, path);
}

function isRoute(arg: unknown): arg is MinRoute {
  // @ts-ignore: todo
  return arg && typeof arg.handlerRequest === "function";
}
