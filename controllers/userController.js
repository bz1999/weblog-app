const User = require("../models/User");
const Post = require("../models/post");
const Follow = require("../models/Follow");

exports.home = async function (req, res) {
  if (req.session.user) {
    const posts = await Post.getFeed(req.session.user._id);
    console.log(posts);
    res.render("home-dashboard", { posts: posts });
  } else {
    res.render("home-guest", {
      regErrors: req.flash("regErrors"),
    });
  }
};

exports.register = function (req, res) {
  const user = new User(req.body);
  user
    .register()
    .then(() => {
      req.session.user = {
        _id: user.data._id,
        username: user.data.username,
        avatar: user.avatar,
      };
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch((regErrors) => {
      regErrors.forEach(function (error) {
        req.flash("regErrors", error);
      });
      req.session.save(function () {
        res.redirect("/");
      });
    });
};

exports.login = function (req, res) {
  const user = new User(req.body);
  user
    .login()
    .then((result) => {
      req.session.user = {
        _id: user.data._id,
        username: user.data.username,
        avatar: user.avatar,
      };
      req.session.save(function () {
        res.redirect("/");
      });
    })
    .catch((e) => {
      // req.session.flash.errros = [e]
      req.flash("errors", e);
      req.session.save(function () {
        res.redirect("/");
      });
    });
};

exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect("/");
  });
};

exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform that action.");
    req.session.save(function () {
      res.redirect("/");
    });
  }
};

exports.ifUserExists = function (req, res, next) {
  User.findByUsername(req.params.username)
    .then(function (userDocument) {
      req.profileUser = userDocument;
      next();
    })
    .catch(function () {
      res.render("404");
    });
};

exports.sharedProfileData = async function (req, res, next) {
  req.isVisitorsProfile =
    req.session.user && req.profileUser._id.equals(req.session.user._id);

  req.isFollowing =
    req.session.user &&
    (await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId));

  // retrieve post, follower & following counts
  const [postCount, followerCount, followingCount] = await Promise.all([
    Post.countPostsByAuthor(req.profileUser._id),
    Follow.countFollowersById(req.profileUser._id),
    Follow.countFollowingById(req.profileUser._id),
  ]);

  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;

  next();
};

exports.profilePostsScreen = function (req, res) {
  // ask our post model for posts by a certain author id
  Post.findByAuthorId(req.profileUser._id)
    .then(function (posts) {
      res.render("profile", {
        currentPage: "posts",
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isVisitorsProfile: req.isVisitorsProfile,
        isFollowing: req.isFollowing,
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount,
        },
      });
    })
    .catch(function () {
      res.render("404");
    });
};

exports.profileFollowersScreen = async function (req, res) {
  try {
    const followers = await Follow.getFollowersById(req.profileUser._id);
    res.render("profile-followers", {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isVisitorsProfile: req.isVisitorsProfile,
      isFollowing: req.isFollowing,
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
    });
  } catch (error) {
    res.render("404");
  }
};

exports.profileFollowingScreen = async function (req, res) {
  try {
    const following = await Follow.getFollowingById(req.profileUser._id);
    res.render("profile-following", {
      currentPage: "following",
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isVisitorsProfile: req.isVisitorsProfile,
      isFollowing: req.isFollowing,
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount,
      },
    });
  } catch (error) {
    res.render("404");
  }
};
