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

# Benchmark

[code here](./src/benchmark)

```
macOS Big Sur
MacBook Pro (16-inch, 2019)
2.6 GHz 6-Core Intel Core i7
16 GB 2667 MHz DDR4

NodeJS: v14.15.4

Running 30s test @ http://localhost:3000/user/123?size=10&page=10
  12 threads and 400 connections
```

| framework | version | latency(avg, max)  | req/sec(avg, max) | Requests/sec | Transfer/sec |
| --------- | ------- | ------------------ | ----------------- | ------------ | ------------ |
| lid       | dev     | 100.52ms, 444.20ms | 354.20, 676.00    | 4089.36      | 794.71KB     |
| fastify   | 3.15.1  | 193.78ms, 635.76ms | 290.56, 680.00    | 1978.71      | 539.12KB     |
| express   | 4.17.1  | 202.19ms, 662.23ms | 178.85, 333.00    | 1978.71      | 539.12KB     |

<details>
<summary>DETAIL</summary>

lid

```
Running 30s test @ http://localhost:3000/user/123?size=10&page=10
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   100.52ms   53.98ms 444.20ms   91.73%
    Req/Sec   354.20    120.43   676.00     68.13%
  123112 requests in 30.11s, 23.36MB read
  Socket errors: connect 0, read 686, write 0, timeout 0
Requests/sec:   4089.36
Transfer/sec:    794.71KB
```

fastify

```
Running 30s test @ http://localhost:3002/user/123?size=10&page=10
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   193.78ms  160.51ms 635.76ms   78.30%
    Req/Sec   290.56    190.96   680.00     54.32%
  69357 requests in 30.08s, 14.15MB read
  Socket errors: connect 0, read 574, write 3, timeout 0
Requests/sec:   2305.56
Transfer/sec:    481.83KB
```

express

```
Running 30s test @ http://localhost:3001/user/123?size=10&page=10
  12 threads and 400 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   202.19ms   86.54ms 662.23ms   82.66%
    Req/Sec   178.85     81.13   333.00     62.46%
  59537 requests in 30.09s, 15.84MB read
  Socket errors: connect 0, read 580, write 0, timeout 0
Requests/sec:   1978.71
Transfer/sec:    539.12KB
```

</details>

## TODO

- [ ] testing
- [ ] OpenAPI
