import type { Spatula } from "./spatula";

export type Next = () => Promise<void>;
export type Middleware = (spatula: Spatula, next: Next) => Promise<void>;
