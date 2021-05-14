import express from "express";

const app = express();
app
  .use(express.json())
  .get("/user/:id", (req, res) => {
    res.json({
      list: [{ name: "yinz", age: 13 }],
      page: 1,
    });
  })
  .listen(3000);
