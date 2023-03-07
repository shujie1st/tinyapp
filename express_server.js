const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080; // default port 8080

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

// Implement function to generate a requested length of string with random alphanumeric characters
const generateRandomString = function(length) {
  const input = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let output = "";
  for (let i = 0; i < length; i++) {
    output += input.charAt(Math.floor(Math.random() * input.length));
  }
  return output;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]   };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString(6); // generate a random string of 6 characters for short URL id
  urlDatabase[id] = req.body.longURL; // save the longURL and the random generated short URL id to urlDatabase
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${id}`); // Respond with a redirection to /urls/:id
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect("/urls")
});

app.post("/login", (req, res) => {
  res.cookie("username", username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username")
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const userId = generateRandomString(6);
  const user = {
    id: userId,
    email: req.body.email,
    password: req.body.password,
  };
  users[userId] = user;
  res.cookie("user_id", userId);
  console.log(users);
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});