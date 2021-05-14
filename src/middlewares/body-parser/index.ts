import { IncomingMessage } from "http";
import zlib from "zlib";
import { Middleware } from "../../wok";

export function parseBody(): Middleware {
  return async (spatula, next) => {
    const contentType = spatula.req.headers["content-type"] ?? "text/plain";
    const content = await getContent(spatula.req);

    if (contentType.includes("application/json") && content) {
      spatula.body = JSON.parse(content);
    } else {
      spatula.body = content;
    }

    return next();
  };
}

function getContent(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const length = req.headers["content-length"] ?? 0;
    if (length === 0) {
      resolve("");
      return;
    }
    const buffers: Buffer[] = [];
    const encoding = req.headers["content-encoding"];
    const stream = crateStream(req, encoding);

    stream.on("data", (data) => {
      buffers.push(data);
    });

    stream.on("end", () => {
      const content = Buffer.concat(buffers).toString();
      resolve(content);
    });

    stream.once("error", reject);
  });
}

function crateStream(req: IncomingMessage, encoding?: string) {
  if (encoding === "gzip") {
    const stream = zlib.createGunzip();
    req.pipe(stream);
    return stream;
  }

  if (encoding === "deflate") {
    const stream = zlib.createInflate();
    req.pipe(stream);
    return stream;
  }

  return req;
}
