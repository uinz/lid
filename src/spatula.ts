import qs from "querystring";
import { HTTPMethod } from "find-my-way";
import { IncomingMessage, ServerResponse } from "http";

export class Spatula {
  readonly url: string;
  readonly path: string;
  readonly query: object;
  readonly method: HTTPMethod;

  constructor(readonly req: IncomingMessage, readonly res: ServerResponse) {
    const url = req.url ?? "";
    const i = url.indexOf("?");
    const queryStr = url.slice(i + 1);

    this.url = url;
    this.path = url.slice(0, i);
    this.query = { ...qs.parse(queryStr) };
    this.method = req.method?.toUpperCase() as HTTPMethod;
  }

  status(code?: number) {
    if (code) {
      this.res.statusCode = code;
    }
    return this;
  }

  header(key: string, value?: string) {
    if (value) {
      this.res.setHeader(key, value);
    }
    return this;
  }

  response(data?: string | Buffer) {
    this.res.end(data);
    return this;
  }
}
