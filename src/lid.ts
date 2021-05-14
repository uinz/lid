import findMyWay from "find-my-way";
import { createServer } from "http";
import createHttpError, { isHttpError } from "http-errors";
import { IRoute } from "./route";
import { Spatula } from "./spatula";
import { Wok } from "./wok";

export class Lid extends Wok {
  readonly #server = createServer((req, res) => {
    const spatula = new Spatula(req, res);
    this.stir(spatula);
  });

  readonly #router = findMyWay({
    ignoreTrailingSlash: true,
    caseSensitive: false,
    defaultRoute() {
      throw createHttpError(404);
    },
  });

  boiling(port: number) {
    return new Promise<void>((resolve) => {
      this.#server.listen(port, resolve);
    });
  }

  mount(route: IRoute | Record<string, IRoute>) {
    if (isRoute(route)) {
      this.#router.on(
        route.method,
        route.path,
        // do not use arrow function
        function (this: { spatula: Spatula }, _req, _res, params) {
          return route.run(this.spatula, params);
        }
      );
    } else {
      Object.values(route).forEach(this.mount, this);
    }
    return this;
  }

  private async stir(spatula: Spatula) {
    // depend on #lookup will return handle result(Promise)
    const route = async () => {
      try {
        await this.#router.lookup(spatula.req, spatula.res, { spatula });
      } catch (err) {
        this.handleError(spatula, err);
      }
    };
    await this.spoon(spatula, route);
  }

  private handleError(spatula: Spatula, error: Error) {
    if (isHttpError(error)) {
      const data = {
        status: error.status,
        message: error.message,
        stack: process.env.NODE_ENV !== "production" ? error.stack : error.message,
      };
      spatula
        .status(error.status)
        .header("Content-Type", "application/json")
        .end(JSON.stringify(data));
    } else {
      spatula
        .status(500)
        .header("Content-Type", "application/json")
        .end(
          JSON.stringify({
            status: 500,
          })
        );
    }
  }
}

/** crate lib instance */
export function lid() {
  return new Lid();
}

function isRoute(v: unknown): v is IRoute {
  // @ts-ignore
  return typeof v.run === "function";
}
