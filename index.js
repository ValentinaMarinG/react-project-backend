const express = require("express");
const mongoClient  = require("mongoose");
const routes_system = require("./src/routes");

const app = express();

require("dotenv").config();

app.listen(process.env.PORT_PC, () =>
                console.log(`Connect in the port_pc ${process.env.PORT_PC}`)
);

mongoClient.set("strictQuery",false);

mongoClient.connect(process.env.STRING_CONNECTION, {
    useNewUrlParser:true,
    useUnifiedTopology:true,
})
.then(() => console.log("Success connection"))
.catch((err) => console.error(err));

app.use(express.json());

routes_system(app);