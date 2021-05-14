import { lid, route, t } from "..";
import { parseBody } from "../middlewares/body-parser";

const app = lid();

const $query = t.Object({
  size: t.Number({ minimum: 0 }),
  page: t.Number({ minimum: 10, maximum: 100 }),
});

const $user = t.Object({
  name: t.String(),
  age: t.Number(),
});

const $response = t.Object({
  page: t.Number(),
  list: t.Array($user),
});

const routeA = route("GET", "/user/:id")
  .query($query)
  .response($response)
  .use((_spatula, next) => {
    console.log("3");
    next();
  })
  .use(async (_spatula, next) => {
    await next();
    console.log("4");
  })
  .handle((ctx) => {
    console.log(ctx.params);
    return {
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    };
  });

const routeB = route("POST", "/user/")
  .body(
    t.Object({
      username: t.String({ minLength: 4 }),
      password: t.String({ minLength: 4 }),
      email: t.String({ format: "email" }),
    })
  )
  .handle(async (ctx) => {
    const { username, password, email } = ctx.body;
    // await db.save("user", { username, password, email });
    return {
      username,
      password,
      email,
    };
  });

app
  .use(parseBody())
  .use((_spatula, next) => {
    console.log("1");
    next();
  })
  .use(async (_spatula, next) => {
    await next();
    console.log("2");
  })
  .mount(routeA)
  .mount(routeB)
  .boiling(3000)
  .then(() => console.log("Lid start"));
