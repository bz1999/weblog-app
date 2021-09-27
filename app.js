// require does 1. excute the file 2. return the exports
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const router = require("./router");
const flash = require("connect-flash");

const sessionOptions = session({
  secret: "Javascript fullstack complex-app",
  store: MongoStore.create({ client: require("./db") }),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
});

const app = express();

app.use(sessionOptions);
app.use(flash());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));

app.set("views", "views");
app.set("view engine", "ejs");

app.use(function (req, res, next) {
  // make current user id available on the req object
  req.vistorId = req.session.user ? req.session.user._id : 0;

  // make user session data available from within view template
  res.locals.user = req.session.user;
  next();
});

app.use("/", router);

// dont listen until db ready, so export the app for db moudle to start it
// app.listen(4005);
module.exports = app;
