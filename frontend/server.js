const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static files from "project" folder
app.use(express.static(__dirname));

// Auth routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/auth/signin.html"));
});

app.get("/auth/signin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/auth/signin.html"));
});

app.get("/auth/signup.html", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/auth/signup.html"));
});

// Dashboard routes
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/dashboard/index.html"));
});

// Handle all dashboard sub-routes
app.get("/dashboard/:file", (req, res) => {
  const fileName = req.params.file;
  res.sendFile(path.join(__dirname, "/public/dashboard", fileName));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
