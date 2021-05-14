import koa from "koa";

const app = new koa();

app
  .use((ctx, next) => {
    ctx.body = {
      hello: "ok",
    };
  })
  .listen(3000);
