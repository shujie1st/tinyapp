// function to find a user by email in the users database, return undefined if not found
const getUserByEmail = function(email, database) {
  for (const userId in database) {
    if (Object.prototype.hasOwnProperty.call(database, userId)) {
      const user = database[userId];
      if (user.email === email) {
        return user;
      }
    }
  }
};

module.exports = { getUserByEmail };