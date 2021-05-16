import Ajv from "ajv";
import ajvFormats from "ajv-formats";
export { ErrorObject } from "ajv";

export const ajv = ajvFormats(
  new Ajv({
    allErrors: true,
    useDefaults: true,
    coerceTypes: true,
    strict: false,
  })
);
