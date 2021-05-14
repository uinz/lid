import { Spatula } from "./spatula";
import { isArray } from "./utils";

export type Next = () => Promise<void> | void;
export type Middleware = (spatula: Spatula, next: Next) => Promise<void> | void;

export class Wok {
  #mids: Middleware[] = [];

  use(middle: Middleware | Middleware[]) {
    if (isArray(middle)) {
      this.#mids.push(...middle);
    } else {
      this.#mids.push(middle);
    }
    return this;
  }

  stack() {
    return compose(this.#mids);
  }
}

function compose(middles: Middleware[]): Middleware {
  let index = -1;

  return (spatula, next) => {
    const dispatch = (i: number): Promise<void> | void => {
      if (i <= index) {
        throw new Error("next() called multi times");
      }
      index = i;
      if (index === middles.length) {
        return next();
      }
      const mid = middles[index]!;
      return mid(spatula, () => dispatch(index + 1));
    };

    return dispatch(0);
  };
}
