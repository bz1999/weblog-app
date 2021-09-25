// Mongo connect example
// const { MongoClient } = require('mongodb');
// const uri = "mongodb+srv://todoAppUser:<password>@cluster0.q08hd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });

const { MongoClient } = require("mongodb");

const connectionString =
  "mongodb+srv://todoAppUser:kp9BqNpAXD@cluster0.q08hd.mongodb.net/ComplexApp?retryWrites=true&w=majority";

const mongoClient = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoClient.connect((err) => {
  module.exports = mongoClient.db();

  err && console.log(err.message);

  // start server and listening on port 4005
  const app = require("./app");
  app.listen(4005);
});
