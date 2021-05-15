import { HTTPMethod } from "find-my-way";
import { IncomingMessage, ServerResponse } from "http";
import qs from "querystring";

export class Spatula<
  Method extends HTTPMethod = any,
  Path extends string = any,
  Params extends object = any,
  Query extends object = any,
  Body = any
> {
  readonly url: string;
  readonly path: Path;
  readonly query: Query;
  readonly method: Method;

  params!: Params;
  body!: Body;

  constructor(readonly req: IncomingMessage, readonly res: ServerResponse) {
    let url = req.url ?? "";
    let i = url.indexOf("?");
    let queryStr = url.slice(i + 1);

    this.url = url;
    this.path = url.slice(0, i) as Path;
    this.query = { ...qs.parse(queryStr) } as Query;
    this.method = req.method?.toUpperCase() as Method;
  }

  status(code?: number) {
    if (code) {
      this.res.statusCode = code;
    }
    return this;
  }

  header(key: string, value?: string | number | (string | number)[]) {
    if (value !== undefined) {
      let v = Array.isArray(value) ? value.join(",") : value.toString();
      this.res.setHeader(key, v);
    }
    return this;
  }

  send(data?: string | Buffer) {
    this.res.end(data);
    return this;
  }
}
