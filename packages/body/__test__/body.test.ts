import { Lid } from "@lid-http/core";
import supertest from "supertest";
import { parseBody } from "../src/index";

describe("parse body", () => {
  it("parse json body", async () => {
    expect.assertions(4);

    let mockedData = {
      name: "yinz",
      age: 13,
      __proto__: {
        danger: "value",
      },
    };

    let app = new Lid();

    app
      .use(parseBody()) // use middleware
      .use((spatula, next) => {
        expect(spatula.body).toStrictEqual(mockedData);
        expect(spatula.query).toStrictEqual({});
        spatula.status(200).send("ok");
        return next();
      });

    let res = await supertest(app.callback()).post("/").send(mockedData);

    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
  });

  it("parse urlencoded body", async () => {
    expect.assertions(4);

    let app = new Lid();

    app
      .use(parseBody()) // use middleware
      .use((spatula, next) => {
        expect(spatula.body).toStrictEqual({ name: "yinz", age: "13" });
        expect(spatula.query).toStrictEqual({});
        spatula.status(200).send("ok");
        return next();
      });

    let res = await supertest(app.callback()).post("/").send("name=yinz&age=13");
    expect(res.status).toBe(200);
    expect(res.text).toBe("ok");
  });
});
