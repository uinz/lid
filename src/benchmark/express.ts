import express from "express";
// @ts-ignore
import cors from "cors";

const app = express();

app.use((_req, _res, next) => {
  console.log(1);
  next();
  console.log(2);
});

const route = express.Router();

route
  .use(cors())
  .use((req, res, next) => {
    console.log(3);
    next();
    console.log(4);
  })
  .get("/user/:id", (req, res) => {
    console.log(req.params);
    res.json({
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    });
  });

app.use(route);
app.listen(3000);
