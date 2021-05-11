import findMyWay from "find-my-way";
import { createServer } from "http";
import { MRoute } from "./route";
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
    defaultRoute(req, res) {
      res.statusCode = 404;
      res.end(`<h1>404</h1><p>${req.url}</p>`);
    },
  });

  boiling(port: number) {
    return new Promise<void>((resolve) => {
      this.#server.listen(port, resolve);
    });
  }

  mount(route: MRoute | Record<string, MRoute>) {
    if (isRoute(route)) {
      this.#router.on(
        route.method,
        route.path,
        // do not use arrow function
        function (this: { spatula: Spatula }, _req, _res, params) {
          route.run(this.spatula, params);
        }
      );
    } else {
      Object.values(route).forEach(this.mount, this);
    }
    return this;
  }

  private async stir(spatula: Spatula) {
    try {
      // depend on #loop will return handle result(Promise)
      const route = () => this.#router.lookup(spatula.req, spatula.res, { spatula });
      await this.spoon(spatula, route);
    } catch (err) {
      this.handleError(spatula, err);
    }
  }

  private handleError(spatula: Spatula, err: Error) {
    console.log("Error", err);
    spatula
      .status(500)
      .response(`<h1>500</h1></p>${spatula.url}</p></p>${err.message}</p><pre>${err.stack}</pre>`);
  }
}

/** crate lib instance */
export function lid() {
  return new Lid();
}

function isRoute(v: unknown): v is MRoute {
  // @ts-ignore
  return typeof v.run === "function";
}
