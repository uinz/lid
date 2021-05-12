# lid body parser

## example

```ts
import { lid, route, t, bodyParser } from "TODO";

const app = lid();

app.use(bodyParser());

const routeA = route("POST", "/test")
  .body(t.Object({ name: t.String() }))
  .handle((ctx) => {
    console.log(ctx.body.name); // string
    return { name: ctx.body.name.toUpperCase() };
  });
```
