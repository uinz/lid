import { noop } from "@lid-http/utils";
import { IncomingMessage } from "http";
import Pino from "pino";

export type Level = Pino.Level | boolean;

type LogFn = (message: string, ...args: unknown[]) => void;

let level: Pino.Level | undefined;

export const pino = Pino({
  name: "lid-http",
});

export interface Logger {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

const DEFAULT_LOGGER = {
  trace: noop,
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

createLogger.id = 0;
export function createLogger(req: IncomingMessage): Logger {
  if (level) {
    let reqId = req.headers["x-request-id"] ?? createLogger.id++;
    return pino.child({ reqId, level });
  }
  return DEFAULT_LOGGER;
}

export function setLevel(l?: Level | boolean) {
  if (!l) return;
  level = l === true ? "trace" : l;
}
