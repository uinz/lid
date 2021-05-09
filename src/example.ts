import { lid, route, t } from "./";

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
    console.log(ctx.params);
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
