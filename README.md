# Lid

Simple, efficient and type-safe http framework

<img style="text-align:center" src="./logo.png" width="400">

---

# Example

```ts
const app = lid();

const $query = t.Object({
  size: t.Number({ minimum: 0 }),
  page: t.Number({ minimum: 10, maximum: 100 }),
});

const $user = t.Object({
  name: t.String(),
  age: t.Number(),
});

const $body = t.Object({
  page: t.Number(),
  list: t.Array($user),
});

const routeA = route("GET", "/user/:id")
  .query($query)
  .body($body)
  .handle((ctx) => {
    // (method) handle(handler: (ctx: {
    //     method: "GET";
    //     url: string;
    //     params: {
    //         id: string;
    //     };
    //     query: {
    //         size: number;
    //         page: number;
    //     };
    // }) => {
    //     page: number;
    //     list: {
    //         name: string;
    //         age: number;
    //     }[];
    // } | Promise<{
    //     page: number;
    //     list: {
    //         name: string;
    //         age: number;
    //     }[];
    // }>): TRoute<...>

    return {
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    };
  });

routeA.addHook("prev", () => {
  console.log("3");
});

routeA.addHook("post", () => {
  console.log("4");
});

const routeB = route("GET", "/")
  .body(t.Object({ hello: t.String() }))
  .handle(() => {
    return {
      hello: "world",
    };
  });

app
  .addHook("prev", () => console.log("1"))
  .addHook("post", () => console.log("2"))
  .mount(routeA)
  .mount(routeB)
  .start(3000)
  .then(() => console.log("Lid start"));

// curl http://localhost:3000/user/123?size=10&page=1
// 1 3 4 2
```

# Reference content

> fastify

- use `find-my-way` (Prefix Tree) for router
- use `fast-json-stringify` for stringify
- use `@sinclair/typebox` generate json-schema
- use `ajv` for validate
