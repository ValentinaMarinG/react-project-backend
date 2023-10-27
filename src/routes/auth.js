const express = require("express");
const multiparty = require("connect-multiparty");
const AuthController = require("../controllers/auth");

const api = express.Router();

const md_upload = multiparty({ uploadDir: "./uploads/users/avatar" });

api.post("/register", md_upload, AuthController.register);
api.post("/login", AuthController.login);
api.post("/refresh_access_token", AuthController.refreshAccessToken);

module.exports = api;
