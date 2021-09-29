const postsCollection = require("../db").db().collection("posts");
const ObjectId = require("mongodb").ObjectId;
const User = require("./User");
const sanitizeHTML = require("sanitize-html");

postsCollection.createIndex({ title: "text", body: "text" });

const Post = function (data, userid, requestedPostId) {
  this.data = data;
  this.userid = userid;
  this.requestedPostId = requestedPostId;
  this.errors = [];
};

Post.prototype.cleanUp = function () {
  if (typeof this.data.title != "string") {
    this.data.title = "";
  }

  if (typeof this.data.body != "string") {
    this.data.body = "";
  }

  // get rid of any bogus properties and add creation date
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), { allowedTags: [], allowedAttributes: [] }),
    body: sanitizeHTML(this.data.body.trim(), { allowedTags: [], allowedAttributes: [] }),
    createdDate: new Date(),
    author: ObjectId(this.userid),
  };
};

Post.prototype.validate = function () {
  if (!this.data.title.length) {
    this.errors.push("You must provide a title.");
  }

  if (!this.data.body.length) {
    this.errors.push("You must provide post content.");
  }
};

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp();
    this.validate();
    if (!this.errors.length) {
      // save post into database
      postsCollection
        .insertOne(this.data)
        .then((result) => {
          resolve(result.insertedId);
        })
        .catch(() => {
          this.errors.push("Please try again later.");
          reject(this.errors);
        });
    } else {
      reject(this.errors);
    }
  });
};

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const post = await Post.findSingleById(this.requestedPostId, this.userid);
      if (post.isVisitorOwner) {
        // actually update the db
        const status = await this.actuallyUpdate();
        resolve(status);
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    this.validate();

    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        { _id: new ObjectId(this.requestedPostId) },
        {
          $set: {
            title: this.data.title,
            body: this.data.body,
          },
        }
      );

      resolve("success");
    } else {
      resolve("failure");
    }
  });
};

Post.reusablePostQuery = function (uniqueOperations, visitorId, finalOperations = []) {
  return new Promise(async function (resolve, reject) {
    const aggOperations = uniqueOperations
      .concat([
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorDocument",
          },
        },
        {
          $project: {
            title: 1,
            body: 1,
            createdDate: 1,
            authorId: "$author",
            author: { $arrayElemAt: ["$authorDocument", 0] },
          },
        },
      ])
      .concat(finalOperations);

    // Mongodb Aggregation. toArray returns a promise
    let posts = await postsCollection.aggregate(aggOperations).toArray();

    // clean up author property in each post object
    posts = posts.map(function (post) {
      post.isVisitorOwner = post.authorId.equals(visitorId);

      // set undefined is faster than delete
      post.authorId = undefined;

      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar,
      };
      return post;
    });

    resolve(posts);
  });
};

Post.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != "string" || !ObjectId.isValid(id)) {
      reject();
      return;
    }

    let posts = await Post.reusablePostQuery(
      [{ $match: { _id: new ObjectId(id) } }],
      visitorId
    );

    if (posts.length) {
      resolve(posts[0]);
    } else {
      reject();
    }
  });
};

Post.findByAuthorId = function (authorId) {
  return Post.reusablePostQuery([
    { $match: { author: authorId } },
    { $sort: { createdDate: -1 } },
  ]);
};

Post.delete = function (postIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      const post = await Post.findSingleById(postIdToDelete, currentUserId);
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({ _id: new ObjectId(postIdToDelete) });
        resolve();
      } else {
        reject();
      }
    } catch {
      reject();
    }
  });
};

// Tip
// Owner
// LearnWebCode commented on Mar 11
// Hello everyone, I just pushed a fix to this, found in the following file:

// https://github.com/LearnWebCode/react-course/blob/master/backend-api/models/Post.js

// In the newest version of the MongoDB system itself (local or Atlas Cloud Service, not our NPM package)
// we don't want to use $sort before $project if we're sorting by a search's textScore.
// Simply updating the file I linked to above with the latest version will fix this issue.

// If you're seeing other errors related to search and the backend,
// it's possible you didn't create the indexes properly for the title and body fields.

// Thanks!
// Brad

// Post.search = function (searchTerm) {
//   return new Promise(async (resolve, reject) => {
//     console.log("searchTerm: ", searchTerm);
//     if (typeof searchTerm == "string") {
//       try {
//         const posts = await Post.reusablePostQuery([
//           { $match: { $text: { $search: searchTerm } } },
//           { $sort: { score: { $meta: "textScore" } } },
//         ]);
//         resolve(posts);
//       } catch {
//         reject();
//       }
//     } else {
//       reject();
//     }
//   });
// };

Post.search = function (searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof searchTerm == "string") {
      let posts = await Post.reusablePostQuery(
        [{ $match: { $text: { $search: searchTerm } } }],
        undefined,
        [{ $sort: { score: { $meta: "textScore" } } }]
      );
      resolve(posts);
    } else {
      reject();
    }
  });
};

module.exports = Post;
