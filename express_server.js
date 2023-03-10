const express = require("express");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["some-long-secret-key"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs"); // use EJS as template engine

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "sample",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userId: "sample",
  },
};

const users = {};

// function to generate a specific length of string with random alphanumeric characters
const generateRandomString = function(length) {
  const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let output = "";
  for (let i = 0; i < length; i++) {
    output += input.charAt(Math.floor(Math.random() * input.length));
  }
  return output;
};

// function to find a user in the users object by email, return null if not found
const getUserByEmail = function(email) {
  for (const userId in users) {
    if (Object.prototype.hasOwnProperty.call(users, userId)) {
      if (users[userId].email === email) {
        return users[userId];
      }
    }
  }
  return null;
};

// function to check if a user is logged in by reading the cookie
const isUserLoggedIn = function(req) {
  if (req.session.user_id && Object.prototype.hasOwnProperty.call(users, req.session.user_id)) {
    return true;
  }
  return false;
};

// fucntion to filter the list in urlDatabase by userID
const urlsForUser = function(id) {
  let filteredUrls = {};
  Object.keys(urlDatabase).forEach(key => {
    if (urlDatabase[key].userId === id ) {
      filteredUrls[key] = urlDatabase[key]
    }
  });
  return filteredUrls;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

// render page with a list of URLs from urlDatabase
app.get("/urls", (req, res) => {
  if (!isUserLoggedIn(req)) {
    return res.send("Please login to view your list of URLs!");
  }

  const templateVars = { user: users[req.session.user_id], urls: urlsForUser(req.session.user_id) };
  res.render("urls_index", templateVars);
});

// render page to create new URL
app.get("/urls/new", (req, res) => {
  if (!isUserLoggedIn(req)) {
    return res.redirect("/login");
  }
  const templateVars = { user: users[req.session.user_id]   };
  res.render("urls_new", templateVars);
});

// render URL page by id
app.get("/urls/:id", (req, res) => {
  if (!isUserLoggedIn(req)) {
    return res.send("Please login to view the URL page!");
  }
  if (urlDatabase[req.params.id].userId !== req.session.user_id) {
    return res.send("Access denied!");
  }
  const templateVars = { user: users[req.session.user_id], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

// redirect to the long URL
app.get("/u/:id", (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    return res.sendStatus(404);
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// generate short URL
app.post("/urls", (req, res) => {
  if (!isUserLoggedIn(req)) {
    return res.send("Login required!");
  }
  const id = generateRandomString(6); // generate a random string of 6 characters for short URL id
  urlDatabase[id] = {}; // set the value of ulrDatabase[id] as an object
  urlDatabase[id].longURL = req.body.longURL; // save the "longURL" key-value pair to the "id" key
  urlDatabase[id].userId = req.session.user_id; // save the "userId" key-value pair to the "id" key
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${id}`); // Respond with a redirection to /urls/:id
});

// update URL
app.post("/urls/:id", (req, res) => {
  // return a relevant error message if id does not exist
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    return res.sendStatus(404);
  }
  if (!isUserLoggedIn(req)) {
    return res.send("Login required!");
  }
  if (urlDatabase[req.params.id].userId !== req.session.user_id) {
    return res.send("Access denied!");
  }
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls");
});

// delete URL
app.post("/urls/:id/delete", (req, res) => {
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    return res.sendStatus(404);
  }
  if (!isUserLoggedIn(req)) {
    return res.send("Login required!");
  }
  if (urlDatabase[req.params.id].userId !== req.session.user_id) {
    return res.send("Access denied!");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// render login page
app.get("/login", (req, res) => {
  if (isUserLoggedIn(req)) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("login", templateVars);
});

// render register page
app.get("/register", (req, res) => {
  if (isUserLoggedIn(req)) {
    return res.redirect("/urls");
  }
  const templateVars = { user: users[req.session.user_id] };
  res.render("register", templateVars);
});

// login
app.post("/login", (req, res) => {
  // if a user cannot be found by email
  // or if a user can be located by email, but password not match
  // response back with 403 status code
  let user = getUserByEmail(req.body.email);
  if (user === null || !bcrypt.compareSync(req.body.password, user.password)) {
    return res.sendStatus(403);
  }

  //if bothe checks pass, set "user_id" cookie, then redirect to "/urls"
  req.session.user_id = user.id;
  res.redirect("/urls");
});

// register
app.post("/register", (req, res) => {
  // if empty email/password, or email already exists, response back with 400 status code
  if (!req.body.email || !req.body.password || getUserByEmail(req.body.email) !== null) {
    return res.sendStatus(400);
  }

  // otherwise: create a new user and sets a cookie
  const userId = generateRandomString(6); //generate a random string of 6 characters for user id
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10); // hash password
  const user = {
    id: userId,
    email: req.body.email,
    password: hashedPassword,
  };
  users[userId] = user;
  req.session.user_id = userId;
  console.log(users); // test the users object is properly being appended to
  res.redirect("/urls");
});

// logout & clear cookie
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// listen for requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});