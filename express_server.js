const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs"); // use EJS as template engine

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

// render page with a list of URLs from urlDatabase
app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// render page to create new URL
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]   };
  res.render("urls_new", templateVars);
});

// render URL page by id
app.get("/urls/:id", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// redirect to the long URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// generate short URL
app.post("/urls", (req, res) => {
  const id = generateRandomString(6); // generate a random string of 6 characters for short URL id
  urlDatabase[id] = req.body.longURL; // save the longURL and the random generated short URL id to urlDatabase
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${id}`); // Respond with a redirection to /urls/:id
});

// update URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect("/urls");
});

// delete URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// render login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
});

// render register page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register", templateVars);
});

// login
app.post("/login", (req, res) => {
  // if a user cannot be found by email
  // or if a user can be located by email, but password not match
  // response back with 403 status code
  let user = getUserByEmail(req.body.email);
  if (user === null || user.password !== req.body.password) {
    return res.sendStatus(403);
  }

  //if bothe checks pass, set "user_id" cookie, then redirect to "/urls"
  res.cookie("user_id", user.id);
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
  const user = {
    id: userId,
    email: req.body.email,
    password: req.body.password,
  };
  users[userId] = user;
  res.cookie("user_id", userId);
  console.log(users); // test the users object is properly being appended to
  res.redirect("/urls");
});

// logout & clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

// listen for requests
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});