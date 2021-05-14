import qs from "querystring";
import { HTTPMethod } from "find-my-way";
import { IncomingMessage, ServerResponse } from "http";
import { isArray } from "./utils";

export class Spatula<Method extends HTTPMethod = HTTPMethod> {
  readonly url: string;
  readonly path: string;
  readonly query: object;
  readonly method: Method;

  body?: unknown;

  constructor(readonly req: IncomingMessage, readonly res: ServerResponse) {
    const url = req.url ?? "";
    const i = url.indexOf("?");
    const queryStr = url.slice(i + 1);

    this.url = url;
    this.path = url.slice(0, i);
    this.query = { ...qs.parse(queryStr) };
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
      const v = isArray(value) ? value.join(",") : value.toString();
      this.res.setHeader(key, v);
    }
    return this;
  }

  end(data?: string | Buffer) {
    this.res.end(data);
    return this;
  }
}
