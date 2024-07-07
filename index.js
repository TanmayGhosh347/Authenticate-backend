import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose
  .connect("mongodb://127.0.0.1:27017", { dbName: "backend" })
  .then(() => console.log("Database connected"))
  .catch((e) => console.log(e));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);

const app = express();
let port = 4000;

// seting up view engine
app.set("view engine", "ejs");
// using middle ware
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// middlewares
const isAuthenticate = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decodedJwt = jwt.verify(token, "klghwihgihrignwrvnskrnvjbjihiehwirh");
    // console.log(decodedJwt);
    req.userDetails = await User.findById(decodedJwt._id);
    next();
  } else {
    res.redirect("login");
  }
};

// console.log(path.join(path.resolve() , "public"));

app.get("/", isAuthenticate, (req, res) => {
  // console.log(req.userDetails);
  res.render("logout", { username: req.userDetails.username });
});

app.get("/register", (req, res) => {
  res.render("register");
});

//register user
app.post("/register", async (req, res) => {
  // console.log(req.body);
  const { username, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("login");
  }
  const hashedPass = await bcrypt.hash(password, 10);
  const userDetails = await User.create({
    username,
    email,
    password: hashedPass,
  });
  const token = jwt.sign(
    { _id: userDetails._id },
    "klghwihgihrignwrvnskrnvjbjihiehwirh"
  );

  // console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 10 * 1000),
  });
  res.redirect("/");
});

// login page
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) return res.redirect("register");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res.render("login", { message: "incorrect password", email });

  const token = jwt.sign(
    { _id: user._id },
    "klghwihgihrignwrvnskrnvjbjihiehwirh"
  );

  // console.log(token);
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 10 * 1000),
  });
  res.redirect("/");
});

//logout
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is working on http://localhost:${port}`);
});
