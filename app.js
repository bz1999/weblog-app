// require does 1. excute the file 2. return the exports
const express = require("express");
const router = require("./router");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

app.set("views", "views");
app.set("view engine", "ejs");

app.use("/", router);

// dont listen until db ready, so export the app for db moudle to start it
// app.listen(4005);
module.exports = app;
