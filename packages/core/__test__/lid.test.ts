import supertest from "supertest";
import { Lid, Router, route, Type } from "../src";

function is<T>(_: T) {}

describe("lid core", () => {
  it("GET validate Query", async () => {
    let app = new Lid();
    let router = new Router("/test");
    let route1 = route("GET", "/users/:id")
      .query(
        Type.Object({
          skip: Type.Number({ minimum: 0 }),
          take: Type.Number({
            minimum: 10,
            maximum: 50,
          }),
        })
      )
      .response(Type.Object({ id: Type.Number() }))
      .handle(({ query, params }) => {
        is<number>(query.skip);
        is<number>(query.take);
        return {
          id: Number(params.id),
        };
      });

    router.mount(route1);
    app.use(router.routes());

    await supertest(app.callback())
      .get("/test/users/123")
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.headers["content-type"]).toBe("application/json");
        expect(res.body).toMatchObject({
          status: 400,
          message:
            "query must have required property 'skip', query must have required property 'take'",
          stack: expect.stringContaining("BadRequestError"),
        });
      });

    await supertest(app.callback())
      .get("/test/users/123?skip=0&take=5")
      .then((res) => {
        expect(res.status).toBe(400);
        expect(res.headers["content-type"]).toBe("application/json");
        expect(res.body).toMatchObject({
          status: 400,
          message: "query/take must be >= 10",
          stack: expect.stringContaining("BadRequestError"),
        });
      });

    await supertest(app.callback())
      .get("/test/users/123?skip=0&take=10")
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toBe("application/json");
        expect(res.body).toMatchObject({ id: 123 });
      });
  });
});
