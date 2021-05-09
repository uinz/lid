import { Static, TSchema, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import fastJSON from "fast-json-stringify";
import { HTTPMethod } from "find-my-way";
import { IncomingMessage, ServerResponse } from "http";
import querystring from "querystring";
import { Params, Prettier } from "./types";
import { Hookable } from "./hook";

type Infer<T> = Prettier<Static<T>>;

const ajv = new Ajv({ useDefaults: true, coerceTypes: true, strict: false });

type Ctx<Method, Params, Query> = Prettier<{
  method: Method;
  url: string;
  params: Params;
  query: Query;
}>;

export type TRoute<
  TMethod extends HTTPMethod,
  TPath extends string,
  TParams extends Record<string, unknown> = Params<TPath>,
  TQuery extends Record<string, unknown> = {},
  TBody = void,
  TUsed extends string = never
> = Omit<Route<TMethod, TPath, TParams, TQuery, TBody, TUsed>, TUsed>;

export class Route<
  TMethod extends HTTPMethod = never,
  TPath extends string = never,
  TParams extends Record<string, unknown> = Params<TPath>,
  TQuery extends Record<string, unknown> = {},
  TBody = void,
  TUsed extends string = never
> extends Hookable {
  async run(req: IncomingMessage, res: ServerResponse, params: TParams) {
    if (!this._handler) {
      throw new Error(`${this.path} no handler`);
    }
    await this.runHooks(this._prevHooks, req, res);
    const url = req.url as string;
    const method = req.method as TMethod;
    const data = await this._handler({
      params,
      url,
      method,
      query: this.parseQuery<TQuery>(url),
    });

    this.response(data, req, res);
    await this.runHooks(this._postHooks, req, res);
  }

  constructor(readonly method: TMethod, readonly path: TPath) {
    super();
  }

  private _queryValidate = (_query: unknown) => true;
  query<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, Infer<S>, TBody, TUsed | "query"> {
    this._queryValidate = (query) => {
      return ajv.validate(schema, query);
    };

    // @ts-ignore
    return this;
  }

  private parseQuery<T extends object>(url: string) {
    let query = {} as T;
    const index = url.indexOf("?");
    if (index !== -1) {
      const str = url.slice(index + 1);
      query = { ...querystring.parse(str) } as T;
    }
    if (!this._queryValidate(query)) {
      throw new Error(`query wrong: ${ajv.errorsText()}`);
    }
    return query;
  }

  private _bodyStringify = JSON.stringify;
  body<S extends TSchema>(
    schema: S
  ): TRoute<TMethod, TPath, TParams, TQuery, Infer<S>, TUsed | "body"> {
    this._bodyStringify = fastJSON(schema);
    // @ts-ignore: 类型
    return this;
  }

  private _handler?: (ctx: Ctx<TMethod, TParams, TQuery>) => TBody | Promise<TBody>;
  handle(
    handler: (ctx: Ctx<TMethod, TParams, TQuery>) => TBody | Promise<TBody>
  ): TRoute<TMethod, TPath, TParams, TQuery, TBody, TUsed | "handle"> {
    this._handler = handler;
    // @ts-ignore: 类型
    return this;
  }

  private response(data: unknown, req: IncomingMessage, res: ServerResponse) {
    console.log("accept:", req.headers.accept);

    switch (true) {
      case typeof data === "string":
        res.setHeader("Content-Type", "text/plain");
        res.end(data);
        break;
      case data instanceof Buffer:
        res.end(data);
        break;
      default:
        res.setHeader("Content-Type", "application/json");
        res.end(this._bodyStringify(data));
    }
  }
}

export const t = Type;

export const route = <Method extends HTTPMethod, Path extends string>(
  method: Method,
  path: Path
) => {
  return new Route(method, path);
};

// example
if (0) {
  function is<T>(_: T) {}
  route("GET", "/example/at/:hour(^\\d{2})h:minute(^\\d{2})m")
    .query(Type.Object({ limit: Type.Number({ default: 10 }) }))
    .body(Type.Object({ age: Type.Number(), name: Type.String() }))
    .handle((ctx) => {
      is<string>(ctx.params.hour);
      is<number>(ctx.query.limit);
      return {
        name: "xxx",
        age: 1,
      };
    });
}
