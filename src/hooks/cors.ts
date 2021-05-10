import { isRegExp, isString } from "../utils";
import vary from "vary";
import { IncomingMessage, ServerResponse } from "http";

interface Options {
  origin: string | string[];
  methods: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  headers?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  optionsSuccessStatus: number;
}

type Header = { key: string; value?: string };

const defaults = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204,
};

function isOriginAllowed(
  origin: string | undefined,
  allowedOrigin: boolean | RegExp | string | string[]
): boolean {
  if (!origin) {
    return false;
  }
  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.some((i) => isOriginAllowed(origin, i));
  }
  if (isString(allowedOrigin)) {
    return origin === allowedOrigin;
  }
  if (isRegExp(allowedOrigin)) {
    return allowedOrigin.test(origin);
  }
  return allowedOrigin;
}

function configureOrigin(options: Options, req: IncomingMessage): Header[] {
  const requestOrigin = req.headers.origin;
  const headers: Header[] = [];

  if (isString(options.origin)) {
    if (options.origin === "*") {
      // allow any origin
      headers.push({
        key: "Access-Control-Allow-Origin",
        value: "*",
      });
    } else {
      // fixed origin
      headers.push({
        key: "Access-Control-Allow-Origin",
        value: options.origin,
      });
      headers.push({
        key: 'Vary',
        value: "Origin",
      });
    }
    return headers;
  }

  if (isOriginAllowed(requestOrigin, options.origin)) {
    headers.push({
      key: "Access-Control-Allow-Origin",
      value: requestOrigin,
    });
  }

  headers.push({
    key: "Vary",
    value: "Origin",
  });

  return headers;
}

function configureMethods(options: Options) {
  let methods = options.methods;
  if (Array.isArray(methods)) {
    methods = methods.join(","); // .methods is an array, so turn it into a string
  }
  return {
    key: "Access-Control-Allow-Methods",
    value: methods,
  };
}

function configureCredentials(options: Options): Header | undefined {
  if (options.credentials) {
    return {
      key: "Access-Control-Allow-Credentials",
      value: "true",
    };
  }
}

function configureAllowedHeaders(options: Options, req: IncomingMessage) {
  const headers: Header[] = [];
  let allowedHeaders = options.allowedHeaders ?? options.headers;

  if (!allowedHeaders) {
    allowedHeaders = req.headers["access-control-request-headers"]; // .headers wasn't specified, so reflect the request headers
    headers.push({
      key: "Vary",
      value: "Access-Control-Request-Headers",
    });
  } else if (Array.isArray(allowedHeaders)) {
    allowedHeaders = allowedHeaders.join(","); // .headers is an array, so turn it into a string
  }

  if (allowedHeaders) {
    headers.push({
      key: "Access-Control-Allow-Headers",
      value: allowedHeaders,
    });
  }

  return headers;
}

function configureExposedHeaders(options: Options): Header | undefined {
  let headers = options.exposedHeaders;
  if (!headers) {
    return;
  }
  if (Array.isArray(headers)) {
    headers = headers.join(","); // .headers is an array, so turn it into a string
  }
  return {
    key: "Access-Control-Expose-Headers",
    value: headers,
  };
}

function configureMaxAge(options: Options) {
  const maxAge = options.maxAge?.toString();
  if (maxAge) {
    return {
      key: "Access-Control-Max-Age",
      value: maxAge,
    };
  }
}

function applyHeaders(headers: Header[], res: ServerResponse) {
  headers.forEach((header) => {
    if (header.key === "Vary" && header.value) {
      vary(res, header.value);
    } else if (header.value) {
      res.setHeader(header.key, header.value);
    }
  });
}

export function cors(options: Partial<Options>) {
  return (req: IncomingMessage, res: ServerResponse) => {
    const corsOptions = { ...defaults, ...options };
    const method = req.method?.toUpperCase();

    const headers: Header[] = [];
    const append = (header?: Header | Header[]) => {
      if (Array.isArray(header)) {
        header.forEach(append);
      } else if (header?.value) {
        headers.push(header);
      }
    };

    if (method === "OPTIONS") {
      // preflight
      append(configureOrigin(corsOptions, req));
      append(configureCredentials(corsOptions));
      append(configureMethods(corsOptions));
      append(configureAllowedHeaders(corsOptions, req));
      append(configureMaxAge(corsOptions));
      append(configureExposedHeaders(corsOptions));
      applyHeaders(headers, res);
      res.statusCode = corsOptions.optionsSuccessStatus;
      res.setHeader("Content-Length", "0");
      res.end();
    } else {
      // actual response
      append(configureOrigin(corsOptions, req));
      append(configureCredentials(corsOptions));
      append(configureExposedHeaders(corsOptions));
      applyHeaders(headers, res);
    }
  };
}
