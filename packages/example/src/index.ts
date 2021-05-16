import { Lid } from "@lid-http/core";
import { route, Router, Type } from "@lid-http/router";

// new app instance
const app = new Lid({
  logger: true,
});

// configure `middleware` for the whole app
app.use(async ({ logger }, next) => {
  logger.info("app 1");
  // like koa, must await or return the `next()`
  await next();
  logger.info("app 2");
});

// new router with prefix
const router = new Router("/example");

// can configure `middleware` for this router separately
router.use(async ({ logger }, next) => {
  logger.info("router 1");
  // like koa, must await or return the `next()`
  await next();
  logger.info("router 2");
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
    // eslint-disable-next-line no-console
    console.log("Lid example start...");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
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
