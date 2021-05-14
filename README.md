# Lid

**Goal:** Simple, efficient and type-safe http framework

<img style="text-align:center" src="./logo.png" width="240">

---

# Example

```ts
import { lid, route, t } from "TODO";

const app = lid();

const $query = t.Object({
  size: t.Number({ minimum: 10, maximum: 100 }),
  page: t.Number({ minimum: 1 }),
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
  .use((_spatula, next) => {
    console.log("3");
    next();
  })
  .use((_spatula, next) => {
    next();
    console.log("4");
  })
  .handle((ctx) => {
    console.log(ctx.params);
    console.log(ctx.body);
    return {
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    };
  });

app
  .use((_spatula, next) => {
    console.log("1");
    next();
  })
  .use((_spatula, next) => {
    next();
    console.log("2");
  })
  .mount(routeA)
  .boiling(3000)
  .then(() => console.log("Lid start"));

// curl http://localhost:3000/user/123?size=10&page=1
// 1 3 4 2
```

<img src="https://user-images.githubusercontent.com/12208108/117817207-f2e89000-b299-11eb-86db-96295e019ecd.png" width="500">

# Reference content

## fastify

- use `find-my-way` (Prefix Tree) for router
- use `fast-json-stringify` for stringify
- use `@sinclair/typebox` generate json-schema
- use `ajv` for validate

## Koa

- onion model

## [Benchmark]("./src/benchmark")

## TODO

- [ ] testing
- [ ] OpenAPI
