const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
const path = require("path")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json())

dotenv.config({path: "./config.env"});
require("./db/conn");

const port = process.env.PORT || 8000;

const staticPath = path.join(__dirname, "./public");
app.set("view engine", "hbs");

app.use(express.static(staticPath));

app.use(express.json());

app.use(require("./route"));


app.listen(port, () => {
    console.log(`server is running at port number ${port}`);
});