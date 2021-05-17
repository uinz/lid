import { Spatula, Wok } from "@lid-http/core";
import { pino } from "@lid-http/core/src/logger";
import findMyWay, { HTTPMethod } from "find-my-way";
import createHttpError from "http-errors";
import path from "path";

interface MiniRoute {
  method: HTTPMethod;
  path: string;
  handlerRequest(spatula: Spatula): void;
}

export class Router extends Wok {
  readonly #routes = new WeakSet<MiniRoute>();
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

  mount(route: MiniRoute | MiniRoute[] | Record<string, MiniRoute>) {
    if (isRoute(route)) {
      if (this.#routes.has(route)) {
        pino.warn(`[${route.method}] ${route.path} already mount`);
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

function isRoute(arg: unknown): arg is MiniRoute {
  // @ts-ignore: todo
  return arg && typeof arg.handlerRequest === "function";
}
