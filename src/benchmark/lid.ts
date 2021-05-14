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
  .handle(() => {
    return {
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    };
  });

app
  .use(parseBody())
  .mount(routeA)
  .start(3000)
  .then(() => console.log("Lid start"));
