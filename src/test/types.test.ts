import { expectType, expectError } from "tsd";
import { Params } from "../types";

type T0 = Params<"/example/:userId/:secretToken">;
type T1 = Params<"/example/at/:hour(^\\d{2})h:minute(^\\d{2})m">;
type T2 = Params<"/example/near/:lat-:lng/radius/:r">;
type T3 = Params<"/example/:file(^\\d+).png">;

let string = "string";
let number = 1;

describe("type check", () => {
  it("path Params should parsed correctly ", () => {
    expectType<T0>({
      userId: string,
      secretToken: string,
    });

    expectError<T0>({
      // @ts-expect-error
      userId: number,
      secretToken: string,
    });

    expectType<T1>({
      hour: string,
      minute: string,
    });

    expectError<T1>({
      // @ts-expect-error
      hour: number,
      minute: string,
    });

    expectType<T2>({
      lat: string,
      lng: string,
      r: string,
    });

    expectError<T2>({
      // @ts-expect-error
      lat: number,
      lng: string,
      r: string,
    });

    expectType<T3>({
      file: string,
    });

    expectError<T3>({
      // @ts-expect-error
      file: number,
    });
  });
});
