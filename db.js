const dotenv = require("dotenv");
dotenv.config();

const { MongoClient } = require("mongodb");

const mongoClient = new MongoClient(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoClient
  .connect()
  .then((client) => {
    module.exports = client;
    // start server and listening on the specified port
    const app = require("./app");
    app.listen(process.env.PORT);
  })
  .catch((err) => {
    console.log(err.code, err.message);
  });
