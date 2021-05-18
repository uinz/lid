import { Wok } from "../wok";

describe("Wok", () => {
  it("onion mode", async () => {
    expect.hasAssertions();

    let fn = jest.fn();

    await new Wok()
      .use(async (_, next) => {
        fn(1);
        await next();
        fn(2);
      })
      .use(async (_, next) => {
        fn(3);
        await next();
        fn(4);
      })
      .use(async (_, next) => {
        fn(5);
        await next();
        fn(6);
      })
      .stack()({} as any, () => Promise.resolve());

    expect(fn).toHaveBeenNthCalledWith(1, 1);
    expect(fn).toHaveBeenNthCalledWith(2, 3);
    expect(fn).toHaveBeenNthCalledWith(3, 5);
    expect(fn).toHaveBeenNthCalledWith(4, 6);
    expect(fn).toHaveBeenNthCalledWith(5, 4);
    expect(fn).toHaveBeenNthCalledWith(6, 2);
  });

  it("nested", async () => {
    expect.hasAssertions();

    let fn = jest.fn();

    let wok1 = new Wok()
      .use(async (_, next) => {
        fn(1);
        await next();
        fn(2);
      })
      .use(async (_, next) => {
        fn(3);
        await next();
        fn(4);
      })
      .use(async (_, next) => {
        fn(5);
        await next();
        fn(6);
      });

    let wok2 = new Wok()
      .use(async (_, next) => {
        fn(7);
        await next();
        fn(8);
      })
      .use(async (_, next) => {
        fn(9);
        await next();
        fn(10);
      })
      .use(async (_, next) => {
        fn(11);
        await next();
        fn(12);
      });

    await wok1.use(wok2.stack()).stack()({} as any, () => Promise.resolve());

    let expectOrder = [1, 3, 5, 7, 9, 11, 12, 10, 8, 6, 4, 2];

    expectOrder.forEach((v, i) => {
      expect(fn).toHaveBeenNthCalledWith(i + 1, v);
    });
  });

  it("catch error", async () => {
    expect.hasAssertions();

    let wok = new Wok();
    let fn = jest.fn();

    wok
      .use(async (_, next) => {
        fn(1);
        try {
          await next();
        } catch (err) {
          fn(2);
          throw err;
        }
      })
      .use((_, next) => {
        fn(3);
        return next();
      })
      .use(() => {
        fn(4);
        throw new Error("oops");
      })
      .use((_, next) => {
        fn(5);
        return next();
      });

    let task = wok.stack()({} as any, () => Promise.resolve());

    await expect(task).rejects.toEqual(new Error("oops"));
    expect(fn).toBeCalledTimes(4);
  });
});
