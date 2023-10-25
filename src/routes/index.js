const express = require("express");
const user_routes_access = require("./userRoutes");
const routes = express.Router();

const routes_system = (app) => {
    /* http://localhost:5000/api/v1 */
    app.use("/api/v1", routes);
    /* http://localhost:5000/api/v1/users */
    routes.use("/users", user_routes_access);
};

module.exports = routes_system;