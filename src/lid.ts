import findMyWay, { HTTPMethod } from "find-my-way";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { Hookable } from "./hook";
import { Fn } from "./types";

interface MinRoute {
  method: HTTPMethod;
  path: string;
  run: Fn;
}

export class Lid extends Hookable {
  private readonly server = createServer(this.listener.bind(this));

  private readonly router = findMyWay({
    ignoreTrailingSlash: true,
    caseSensitive: false,
    defaultRoute(req, res) {
      res.statusCode = 404;
      res.end(`<h1>404</h1><p>${req.url}</p>`);
    },
  });

  start(port: number) {
    return new Promise<void>((resolve) => {
      this.server.listen(port, resolve);
    });
  }

  mount(route: MinRoute | Record<string, MinRoute>) {
    if (isMinRoute(route)) {
      this.router.on(route.method, route.path, route.run.bind(route));
    } else {
      Object.values(route).forEach(this.mount, this);
    }
    return this;
  }

  private async listener(req: IncomingMessage, res: ServerResponse) {
    const { url, method } = req as { method: HTTPMethod; url: string };
    const path = url.slice(0, url.indexOf("?"));
    const route = this.router.find(method, path);

    if (!route) {
      this.handleError(new Error("500"), req, res);
      return;
    }

    try {
      await this.runHooks("prev", req, res);
      await route.handler(req, res, route.params, route.store);
      await this.runHooks("post", req, res);
    } catch (err) {
      this.handleError(err, req, res);
    }
  }

  private handleError(err: Error, req: IncomingMessage, res: ServerResponse) {
    console.log("Error", err);
    res.statusCode = 500;
    res.end(`<h1>500</h1></p>${req.url}</p></p>${err.message}</p><pre>${err.stack}</pre>`);
  }
}

export function lid() {
  return new Lid();
}

function isMinRoute(v: unknown): v is MinRoute {
  // @ts-ignore
  return typeof v.run === "function";
}
