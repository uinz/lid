# body-parser ![image](https://user-images.githubusercontent.com/12208108/119231640-7e90d500-bb54-11eb-9652-ed0fc0a0b326.png)


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

## TODO

[ ] support `multipart/form-data`
