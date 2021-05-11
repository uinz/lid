import { Spatula } from "./spatula";

export type Next<T = void> = () => Promise<T> | T;
export type Middleware<T = void> = (spatula: Spatula, next: Next) => Promise<T> | T;

export class Wok {
  #mids: Middleware[] = [];

  use(middle: Middleware | Middleware[]) {
    if (Array.isArray(middle)) {
      this.#mids.push(...middle);
    } else {
      this.#mids.push(middle);
    }
    return this;
  }

  async spoon(spatula: Spatula, _next: Next) {
    let i = 0;
    const pop = () => this.#mids[i++];
    const next = async () => {
      const middle = pop();
      if (middle) {
        await middle(spatula, next);
      } else {
        await _next();
      }
    };
    return next();
  }
}
