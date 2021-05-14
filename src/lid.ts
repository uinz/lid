import findMyWay from "find-my-way";
import { createServer, IncomingMessage, ServerResponse } from "http";
import createHttpError, { isHttpError } from "http-errors";
import { IRoute } from "./route";
import { Spatula } from "./spatula";
import { isArray } from "./utils";
import { Wok } from "./wok";

export class Lid extends Wok {
  readonly #server = createServer(this.handleRequest.bind(this));

  readonly #router = findMyWay({
    ignoreTrailingSlash: true,
    caseSensitive: false,
    defaultRoute() {
      throw createHttpError(404);
    },
  });

  start(port: number) {
    return new Promise<void>((resolve) => {
      this.#server.listen(port, resolve);
    });
  }

  mount(route: IRoute | Record<string, IRoute> | IRoute[]): this {
    if (isArray(route)) {
      route.forEach(this.mount, this);
      return this;
    }

    if (isRoute(route)) {
      this.#router.on(
        route.method,
        route.path,
        // do not use arrow function
        function (this: { spatula: Spatula }, _req, _res, params) {
          this.spatula.params = params;
          return route.handleRequest(this.spatula);
        }
      );
      return this;
    }

    Object.values(route).forEach(this.mount, this);

    return this;
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const spatula = new Spatula(req, res);

    try {
      const stack = this.stack();
      await stack(spatula, async () => {
        await this.#router.lookup(req, res, { spatula });
      });
    } catch (err) {
      this.handleError(spatula, err);
    }
  }

  private handleError(spatula: Spatula, error: Error) {
    const data = isHttpError(error)
      ? {
          status: error.status,
          message: error.message,
          stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
        }
      : {
          status: 500,
          message: error.message,
          stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
        };

    spatula
      .status(data.status)
      .header("Content-Type", "application/json")
      .end(JSON.stringify(data));
  }
}

/** crate lib instance */
export function lid() {
  return new Lid();
}

function isRoute(v: IRoute | Record<string, IRoute>): v is IRoute {
  return typeof v.handleRequest === "function";
}
