import fastify from "fastify";
import { Type } from "@sinclair/typebox";

const app = fastify();

app.addHook("onRequest", (_req, _rep, next) => {
  console.log(1);
  next();
  console.log(2);
});

const $user = Type.Object({
  name: Type.String(),
  age: Type.Number(),
});

const $body = Type.Object({
  page: Type.Number(),
  list: Type.Array($user),
});

app.route({
  url: "/user/:id",
  method: "GET",
  preHandler(_req, _rep, next) {
    console.log(3);
    next();
    console.log(4);
  },
  schema: {
    response: {
      200: $body,
    },
  },
  async handler(req, _rep) {
    console.log(req.params);
    return {
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    };
  },
});

app.listen(3002);
