const express = require("express");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");
const { getUserByEmail, generateRandomString, isUserLoggedIn, urlsForUser, countVisitors } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cookieSession({
  name: "session",
  keys: ["some-long-secret-key"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.set("view engine", "ejs"); // use EJS as template engine

const urlDatabase = {};
const users = {};

// check if user is logged in, then redirect to corresponding page
app.get("/", (req, res) => {
  if (isUserLoggedIn(req, users)) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// render page with a list of URLs created by the user if logged in
app.get("/urls", (req, res) => {
  if (!isUserLoggedIn(req, users)) {
    return res.send("Please login to view your list of URLs!");
  }

  const templateVars = {
    user: users[req.session.userId],
    urls: urlsForUser(req.session.userId, urlDatabase), // filter the URLs list by user_id
    countVisitors: countVisitors
  };
  res.render("urls_index", templateVars);
});

// render page to create new URL if logged in
app.get("/urls/new", (req, res) => {
  if (!isUserLoggedIn(req, users)) {
    return res.redirect("/login");
  }

  const templateVars = { user: users[req.session.userId] };
  res.render("urls_new", templateVars);
});

// render URL page by id
app.get("/urls/:id", (req, res) => {
  // if URL for the given id not exist:
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    return res.status(404).send('Invalid URL id!');
  }
  // if user is not logged in:
  if (!isUserLoggedIn(req, users)) {
    return res.send("Please login to view the URL page!");
  }
  // if user not own this URL with the given id:
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.send("Access denied!");
  }

  const templateVars = {
    user: users[req.session.userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    createTime: urlDatabase[req.params.id].createTime,
    visits: urlDatabase[req.params.id].visits,
    visitorCount: countVisitors(urlDatabase[req.params.id].visits)
  };
  res.render("urls_show", templateVars);
});

// redirect to the long URL
app.get("/u/:id", (req, res) => {
  // if URL for the given id not exist:
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    return res.status(404).send('Invalid URL id!');
  }

  let urlData = urlDatabase[req.params.id];
  let longURL = urlData.longURL;

  // keep track of each visit
  // get visitorId from cookies or create if not exist
  let visitorId = req.cookies["visitor_id"] ? req.cookies["visitor_id"] : generateRandomString(10);
  // store timestamp and visitorId for this visit
  let newVisit = {
    timestamp: new Date(),
    visitorId: visitorId
  };
  urlData.visits.push(newVisit);
  // set visitorId in cookie for future request from this visitor
  res.cookie("visitor_id", visitorId);

  res.redirect(longURL);
});

// generate short URL if logged in
app.post("/urls", (req, res) => {
  if (!isUserLoggedIn(req, users)) {
    return res.send("Login required!");
  }
  const id = generateRandomString(6); // generate a random string of 6 characters for short URL id
  urlDatabase[id] = {}; // set the value of ulrDatabase[id] as an object
  let urlData = urlDatabase[id];
  urlData.createTime = new Date(); // save the create time
  urlData.longURL = req.body.longURL; // save the "longURL" key-value pair
  urlData.userId = req.session.userId; // save the "userId" key-value pair
  urlData.visits = []; // create array to store visits information
  console.log(req.body); // Log the POST request body to the console
  res.redirect(`/urls/${id}`); // Respond with a redirection to /urls/:id
});

// update URL
app.put("/urls/:id", (req, res) => {
  // if URL for the given id not exist:
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    return res.status(404).send('Invalid URL id!');
  }
  // if user is not logged in:
  if (!isUserLoggedIn(req, users)) {
    return res.send("Login required!");
  }
  // if user not own this URL with the given id:
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.send("Access denied!");
  }

  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect("/urls");
});

// delete URL
app.delete("/urls/:id", (req, res) => {
  // if URL for the given id not exist:
  if (!Object.prototype.hasOwnProperty.call(urlDatabase, req.params.id)) {
    return res.status(404).send('Invalid URL id!');
  }
  // if user is not logged in:
  if (!isUserLoggedIn(req, users)) {
    return res.send("Login required!");
  }
  // if user not own this URL with the given id:
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.send("Access denied!");
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// render login page
app.get("/login", (req, res) => {
  // if logged in:
  if (isUserLoggedIn(req, users)) {
    return res.redirect("/urls");
  }
  // if not logged in:
  const templateVars = { user: users[req.session.userId] };
  res.render("login", templateVars);
});

// render register page
app.get("/register", (req, res) => {
  // if logged in:
  if (isUserLoggedIn(req, users)) {
    return res.redirect("/urls");
  }
  // if not logged in:
  const templateVars = { user: users[req.session.userId] };
  res.render("register", templateVars);
});

// login
app.post("/login", (req, res) => {
  let user = getUserByEmail(req.body.email, users);
  // if a user cannot be found by email:
  if (!user) {
    return res.status(403).send('User not found');
  }
  // if a user can be located by email, but password not match:
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    return res.status(403).send('Invalid credentials');
  }

  //if bothe checks pass, set "userId" cookie, then redirect to "/urls"
  req.session.userId = user.id;
  res.redirect("/urls");
});

// register
app.post("/register", (req, res) => {
  // if email or password are empty:
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Email and password are required!');
  }
  //if email already exists:
  if (getUserByEmail(req.body.email, users)) {
    return res.status(400).send('Email already used!');
  }

  // otherwise: create a new user and set a cookie
  const userId = generateRandomString(6); //generate a random string of 6 characters for user id
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10); // encrypts the new user's password with bcrypt
  const user = {
    id: userId,
    email: req.body.email,
    password: hashedPassword,
  };
  users[userId] = user; // save user information
  req.session.userId = userId;
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