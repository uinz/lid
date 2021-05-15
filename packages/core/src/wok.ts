import { Middleware } from "./types";

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

  stack() {
    return compose(this.#mids);
  }
}

function compose(middles: Middleware[]): Middleware {
  return (spatula, next) => {
    let index = -1;

    let dispatch = (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error("next() called multi times");
      }
      index = i;
      if (index === middles.length) {
        return next();
      }
      let mid = middles[index]!;
      return mid(spatula, () => dispatch(index + 1));
    };
    return dispatch(0);
  };
}
