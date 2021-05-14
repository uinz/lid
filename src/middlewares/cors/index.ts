import { Spatula } from "../../spatula";
import { includes, isString } from "../../utils";
import { Middleware } from "../../wok";

interface Options {
  origin: string | string[];
  methods: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
}

const DEFAULT_OPTIONS = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
} as const;

function configureOrigin(spatula: Spatula, options: Options) {
  const requestOrigin = spatula.req.headers.origin;
  if (options.origin === "*") {
    spatula.header("Access-Control-Allow-Origin", "*");
    return;
  }
  if (isString(options.origin)) {
    spatula.header("Access-Control-Allow-Origin", options.origin);
    return;
  }
  if (includes(options.origin, requestOrigin)) {
    spatula.header("Access-Control-Allow-Origin", requestOrigin);
  }
}

function configureMethods(spatula: Spatula, options: Options) {
  spatula.header("Access-Control-Allow-Methods", options.methods);
}

function configureCredentials(spatula: Spatula, options: Options) {
  if (options.credentials) {
    spatula.header("Access-Control-Allow-Credentials", "true");
  }
}

function configureAllowedHeaders(spatula: Spatula, options: Options) {
  const allowedHeaders =
    options.allowedHeaders ?? spatula.req.headers["access-control-request-headers"];

  spatula.header("Access-Control-Allow-Headers", allowedHeaders);
}

function configureExposedHeaders(spatula: Spatula, options: Options) {
  spatula.header("Access-Control-Expose-Headers", options.exposedHeaders);
}

function configureMaxAge(spatula: Spatula, options: Options) {
  spatula.header("Access-Control-Max-Age", options.maxAge);
}

/**
 * lid CORS middleware
 * ```
 * const app = lid();
 * app.use(cors());
 * app.use(spatula => {
 *   spatula.response("CORS enabled");
 * });
 * ```
 */
export function cors(options: Partial<Options>): Middleware {
  const opt = { ...DEFAULT_OPTIONS, ...options };

  return (spatula, next) => {
    configureOrigin(spatula, opt);
    configureCredentials(spatula, opt);
    configureExposedHeaders(spatula, opt);

    if (spatula.method !== "OPTIONS") {
      next();
      return;
    }

    // preflight
    configureMethods(spatula, opt);
    configureAllowedHeaders(spatula, opt);
    configureMaxAge(spatula, opt);

    spatula
      .status(204) // status
      .header("Content-Length", 0) // safari
      .end();
  };
}
