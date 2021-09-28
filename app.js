// require does 1. excute the file 2. return the exports
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const router = require("./router");
const flash = require("connect-flash");
const markdown = require("marked");
const sanitizeHTML = require("sanitize-html");

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
  // make our markdown function avaialable form within ejs templates
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown(content), {
      allowedTags: [
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "strong",
        "bold",
        "i",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ],
      allowedAttributes: {},
    });
  };

  // make all error and success flash messages available from all requests
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");

  // make current user id available on the req object
  req.visitorId = req.session.user ? req.session.user._id : 0;

  // make user session data available from within view template
  res.locals.user = req.session.user;
  next();
});

app.use("/", router);

// dont listen until db ready, so export the app for db moudle to start it
// app.listen(4005);
module.exports = app;
