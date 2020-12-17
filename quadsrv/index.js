#!/usr/bin/env node

//Set up the configuration files
process.env["NODE_CONFIG_DIR"] = "/etc/quad/:../config/";
process.env["QUAD_TR_DIR"] = "../quad/translations";

const express = require("express");
const config = require('config');
const path = require('path');
const api = require('./api/api');;
const db = require("db");
const tokens = require("./tokens");
const bot = require("bot");

(async () => {
    await db.init(false);
    let client = await db.get();
    client.query("CREATE TABLE IF NOT EXISTS webTokens(token TEXT PRIMARY KEY, refreshToken TEXT, accessToken TEXT)");
    client.release();
})();

const app = express();
app.use(express.json({
    limit: "100kb"
}));
app.use(tokens);
app.use("/api", api);
app.use(express.static(path.normalize(`${process.cwd()}/../quadweb/public`)));
app.use("/dist", express.static(path.normalize(`${process.cwd()}/../quadweb/dist`)));

let port = config.get("server.port");
app.listen(port, err => {
    if (err) {
        console.log("Couldn't start the server");
    } else {
        console.log(`Server running on port ${port}`);
    }
});
