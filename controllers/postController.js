const Post = require("../models/Post");

exports.viewCreateScreen = function (req, res) {
  res.render("create-post");
};

exports.create = function (req, res) {
  const post = new Post(req.body, req.session.user._id);

  post
    .create()
    .then(function () {
      res.send("New post created.");
    })
    .catch(function (errors) {
      res.send(errors);
    });
};

exports.viewSingle = async function (req, res) {
  try {
    const post = await Post.findSingleById(req.params.id, req.vistorId);
    res.render("single-post-screen", { post: post });
  } catch (e) {
    res.render("404");
  }
};
