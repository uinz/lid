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
