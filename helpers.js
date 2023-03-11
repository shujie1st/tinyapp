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

// function to generate a specific length of string with random alphanumeric characters
const generateRandomString = function(length) {
  const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let output = "";
  for (let i = 0; i < length; i++) {
    output += input.charAt(Math.floor(Math.random() * input.length));
  }
  return output;
};

// function to check if a user is logged in by reading the cookie
const isUserLoggedIn = function(req, users) {
  if (req.session.user_id && Object.prototype.hasOwnProperty.call(users, req.session.user_id)) {
    return true;
  }
  return false;
};

// fucntion to filter the list in urlDatabase by userID
const urlsForUser = function(id, urlDatabase) {
  let filteredUrls = {};
  Object.keys(urlDatabase).forEach(key => {
    if (urlDatabase[key].userId === id ) {
      filteredUrls[key] = urlDatabase[key]
    }
  });
  return filteredUrls;
};

module.exports = { getUserByEmail, generateRandomString, isUserLoggedIn, urlsForUser };