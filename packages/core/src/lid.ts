import { noop } from "@lid-http/utils";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { isHttpError } from "http-errors";
import { setLevel, pino, Level } from "./logger";
import { Spatula } from "./spatula";
import { Wok } from "./wok";

interface Options {
  logger?: Level;
}

export class Lid extends Wok {
  readonly #server = createServer(this.handleRequest.bind(this));

  constructor(options?: Options) {
    super();

    setLevel(options?.logger);

    process.on("unhandledRejection", (err) => {
      pino.error("unhandledRejection", err);
    });
  }

  start(port: number) {
    return new Promise<void>((resolve) => {
      this.#server.listen(port, resolve);
    });
  }

  callback() {
    return this.#server;
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse) {
    let spatula = new Spatula(req, res);
    this.stack()(spatula, noop).catch((err) => {
      this.handleError(spatula, err);
    });
  }

  private handleError(spatula: Spatula, error: Error) {
    let data = isHttpError(error)
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
      .send(JSON.stringify(data));
  }
}
