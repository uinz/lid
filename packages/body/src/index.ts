/* eslint-disable require-atomic-updates */

import querystring from "querystring";
import { Middleware } from "@lid-http/core";
import { IncomingMessage } from "http";
import zlib from "zlib";

export function parseBody(): Middleware {
  return async (spatula, next) => {
    let contentType = spatula.req.headers["content-type"] ?? "text/plain";
    let content = await getContent(spatula.req);

    if (content) {
      if (contentType.includes("application/json")) {
        spatula.body = JSON.parse(content);
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        spatula.body = { ...querystring.parse(content) };
      } else {
        spatula.body = content;
      }
    }

    return next();
  };
}

function getContent(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let length = req.headers["content-length"] ?? 0;
    if (length === 0) {
      resolve("");
      return;
    }
    let buffers: Buffer[] = [];
    let encoding = req.headers["content-encoding"];
    let stream = createStream(req, encoding);

    stream.on("data", (data) => {
      buffers.push(data);
    });

    stream.on("end", () => {
      let content = Buffer.concat(buffers).toString();
      resolve(content);
    });

    stream.once("error", reject);
  });
}

function createStream(req: IncomingMessage, encoding?: string) {
  if (encoding === "gzip") {
    let stream = zlib.createGunzip();
    req.pipe(stream);
    return stream;
  }

  if (encoding === "deflate") {
    let stream = zlib.createInflate();
    req.pipe(stream);
    return stream;
  }

  return req;
}
