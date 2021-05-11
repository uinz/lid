import { lid, route, t } from "..";

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
