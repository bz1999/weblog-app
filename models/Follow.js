const usersCollection = require("../db").db().collection("users");
const followsCollection = require("../db").db().collection("follows");
const ObjectId = require("mongodb").ObjectId;

const Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername;
  this.authorId = authorId;
  this.errors = [];
};

Follow.prototype.cleanUp = function () {
  if (typeof this.followedUsername != "string") {
    this.followedUsername = "";
  }
};

Follow.prototype.validate = async function (action) {
  // followedUsername must exist in database
  const followedAccount = await usersCollection.findOne({
    username: this.followedUsername,
  });

  if (followedAccount) {
    this.followedId = followedAccount._id;
  } else {
    this.errors.push("You cannot follow a user that does not exist.");
  }

  const doesFollowedAlreadyExist = await followsCollection.findOne({
    followedId: this.followedId,
    authorId: new ObjectId(this.authorId),
  });

  if (action == "create") {
    if (doesFollowedAlreadyExist) {
      this.errors.push("Your are already following this user.");
    }
  }

  if (action == "delete") {
    if (!doesFollowedAlreadyExist) {
      this.errors.push("Your cannot stop following someone you do not already follow.");
    }
  }

  // should not be able to follow yourself
  if (this.followedId.equals(this.authorId)) {
    this.errors.push("You cannot follow yourself.");
  }
};

Follow.isVisitorFollowing = async function (followedId, visitorId) {
  const followDoc = await followsCollection.findOne({
    followedId: followedId,
    authorId: new ObjectId(visitorId),
  });

  return followDoc ? true : false;
};

Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("create");
    if (!this.errors.length) {
      await followsCollection.insertOne({
        followedId: this.followedId,
        authorId: new ObjectId(this.authorId),
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate("delete");
    if (!this.errors.length) {
      await followsCollection.deleteOne({
        followedId: this.followedId,
        authorId: new ObjectId(this.authorId),
      });
      resolve();
    } else {
      reject(this.errors);
    }
  });
};

module.exports = Follow;
