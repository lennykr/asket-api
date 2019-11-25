const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

global.moment = require('moment');
moment.locale('nl-be');

const { version: currentVersion } = require('../package.json');

const apiRoutesV1 = require('./app/v1/routes/api');

const app = express();
const port = 8080;

require('dotenv').config();

app.use(express.json())

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use('/v1/', apiRoutesV1);

app.get('/', function (req, res, next) {
    res.send(`API Version: ${ currentVersion }`);
});

mongoose.connect(process.env.DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(
    app.listen(
        port,
        () => { console.log(`Server is running on port ${port}.`); },
    ),
    err => {
        console.error(err);
    }
);
