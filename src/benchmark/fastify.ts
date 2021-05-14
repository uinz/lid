import fastify from "fastify";
import { Type } from "@sinclair/typebox";

const app = fastify();

const $user = Type.Object({
  name: Type.String(),
  age: Type.Number(),
});

const $body = Type.Object({
  page: Type.Number(),
  list: Type.Array($user),
});

const $query = Type.Object({
  size: Type.Number({ minimum: 0 }),
  page: Type.Number({ minimum: 10, maximum: 100 }),
});

app.route({
  url: "/user/:id",
  method: "GET",
  schema: {
    querystring: $query,
    response: {
      200: $body,
    },
  },
  async handler() {
    return {
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    };
  },
});

app.listen(3000);
