# Lid

**Goal:** Simple, efficient and type-safe http framework

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![CI](https://github.com/uinz/lid/actions/workflows/main.yml/badge.svg?)](https://github.com/uinz/lid/actions/workflows/main.yml)

<img style="text-align:center" src="./logo.png" width="240">

---

# Example

```ts
import { Lid, route, Router, Type } from "@lid-http/core";

// new app instance
const app = new Lid();

// configure `middleware` for the whole app
app.use(async (_, next) => {
  console.log("app 1");
  // like koa, must await or return the `next()`
  await next();
  console.log("app 2");
});

// new router with prefix
const router = new Router("/example");

// can configure `middleware` for this router separately
router.use(async (_, next) => {
  console.log("router 1");
  // like koa, must await or return the `next()`
  await next();
  console.log("router 2");
});

const $response = Type.Object({
  id: Type.Number(),
  username: Type.String(),
  email: Type.String(),
});

// config route
const getUser = route("GET", "/users/:id(\\d+)")
  .response($response)
  .handle((spatula) => {
    // spatula: runtime parameters and types are the `same`
    spatula.params; // { id: string }

    let id = Number(spatula.params.id);
    let username = `yinz-${id}`;
    let email = `${username}@example.com`;

    // The return type needs to be assignable to the $response type,
    // otherwise there will be a type error
    return {
      id,
      username,
      email,
    };
  });

// mount route
// for convenience, the `router#mount` method also accept a `Record<string, Route>` or `Route[]`
// so you can code as below
// import * as routes from "somewhere"
// router.mount(routes);
router.mount(getUser);

void app
  .use(router.routes()) // mount router
  .start(3000) // start server
  .then(() => {
    console.log("Lid example start...");
  })
  .catch((err) => {
    console.error("Lid start up fail", err);
  });

// then curl http://localhost:3000/example/users/13

// log order: "app 1" -> "router 1" -> "router 2" -> "app 2"

// response:
// {
//   "id": 13,
//   "username": "yinz-13",
//   "email": "yinz-13@example.com",
// }
```

find more examples from [here](./packages/example)

# Reference content

## fastify

- use `find-my-way` (Prefix Tree) for router
- use `fast-json-stringify` for stringify
- use `@sinclair/typebox` generate json-schema
- use `ajv` for validate

## Koa

- onion model

## TODO

- [ ] Testing
  - [ ] type
  - [ ] unit
  - [ ] e2e
- [ ] OpenAPI
- [ ] Performance
