import { IncomingMessage, ServerResponse } from "http";
import qs from "querystring";
import { createLogger, Logger } from "./logger";

export class Spatula<
  Method extends string = any,
  Path extends string = any,
  Params extends object = any,
  Query extends object = any,
  Body = any
> {
  readonly url: string;
  readonly path: Path;
  readonly query: Query;
  readonly method: Method;
  readonly logger: Logger;

  params!: Params;
  body!: Body;

  constructor(readonly req: IncomingMessage, readonly res: ServerResponse) {
    let url = req.url ?? "";
    let i = url.indexOf("?");

    this.logger = createLogger(req);

    this.url = url;
    this.path = url.slice(0, i) as Path;
    this.method = req.method?.toUpperCase() as Method;

    if (i > -1) {
      this.query = { ...qs.parse(url.slice(i + 1)) } as Query;
    } else {
      this.query = {} as Query;
    }
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
