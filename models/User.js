// load user model (collection) from mongodb
const usersColletion = require("../db").collection("users");

const validator = require("validator");

const User = function (data) {
  this.data = data;
  this.errors = [];
};

User.prototype.cleanUp = function () {
  if (typeof this.data.username != "string") {
    this.data.username = "";
  }

  if (typeof this.data.email != "string") {
    this.data.email = "";
  }

  if (typeof this.data.password != "string") {
    this.data.password = "";
  }

  // get rid of any bogus properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password,
  };
};

User.prototype.validate = function () {
  // Validate username
  if (this.data.username.length == 0) {
    this.errors.push("You must provide a username.");
  } else {
    if (!validator.isAlphanumeric(this.data.username)) {
      this.errors.push("Username can only contain letters and numbers.");
    }
    if (this.data.username.length < 3) {
      this.errors.push("Username must be at least 3 characters.");
    } else if (this.data.username.length > 30) {
      this.errors.push("Username cannot exeed 30 charaters.");
    }
  }

  // Validate email
  if (!validator.isEmail(this.data.email)) {
    this.errors.push("You must provide a valid email address.");
  }

  // Validate password
  if (this.data.password.length == 0) {
    this.errors.push("You must provide a password.");
  } else if (this.data.password.length < 8) {
    this.errors.push("Password must be at least 8 characters.");
  } else if (this.data.password.length > 50) {
    this.errors.push("Password cannot exeed 50 charaters.");
  }
};

User.prototype.register = function () {
  // Step #1: Validate user data
  this.cleanUp();
  this.validate();

  // Step #2: Only if there are no validation errors
  if (!this.errors.length) {
    usersColletion.insertOne(this.data);
  }

  // then save the user data into a database
};

module.exports = User;
